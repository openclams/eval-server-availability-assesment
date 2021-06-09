import Candidate from "./candidate"
import Improvisation from "./improvisation";

export default class Search{

    /**
     * Harmony Memory Size
     */
    public HMS:number;

    /**
     * Harmony Memory Consideration Rate
     */
    public HMCR:number;

    /**
     * Pitch Adjustment Rate.
     * Probability to select from HM or generate a new imporvisation
     */
    public PAR:number;

    /**
     * Iteration Steps
     */
    public termination:number;

    /**
     * Full Search Space
     * 1st dimension: the instruments (search dimensions)
     * 2nd dimension: the pitches (items in a dimension)
     */
    public candidate_space: Candidate[][];

    /**
     * Reference to the custom loss function
     */
    public loss_function: (n: Candidate[])=>number;

    /**
     * Harmony Memory
     */
    public HM: Improvisation[];


    constructor(
        candidate_space: Candidate[][],
        loss_function:   (n: Candidate[])=>number,
        harmony_memory_size = 5,
        harmony_memory_consideration_rate = 0.95, // probability to select from HM or generate a new imporvisation
        pitch_adjustment_rate = 0.1,
        termination = 1000
    ){
        this.HMS = harmony_memory_size;

        this.HMCR = harmony_memory_consideration_rate;

        this.PAR = pitch_adjustment_rate;

        this.termination = termination;

        this.candidate_space = candidate_space;

        this.prepare_space();

        this.loss_function = loss_function;

        this.init_harmony_memory();

    }

    public prepare_space(){

        this.candidate_space.forEach((dimension:Candidate[]) => {

                dimension.forEach((candidate:Candidate,index) => {
                    candidate.index = index
                    candidate.dimension = dimension
                });

        });
    }

    public print(){
        this.HM.forEach((improvisation,index) => {
            console.log(index+'-',improvisation.candidates.map(c=>c.value),improvisation.loss)
        });
    }

    public run():Improvisation{
        for (let index = 0; index < this.termination; index++) {
            const improvisation = this.create_improvisation();

            this.test_and_replace(improvisation)
          
        }
    
        return this.HM.reduce((prev, current) => (prev.loss < current.loss) ? prev : current)
    }

    public init_harmony_memory(){
        this.HM = []
        for(let index = 0; index< this.HMS; index++){
            this.HM.push(this.create_random_improvisation())
        }
    }

    public randomChoice<T>(a:T[]):T{
        return a[Math.floor(Math.random() * a.length)];
    }

    public create_random_improvisation():Improvisation{
        const candidates:Candidate[] = []
        this.candidate_space.forEach(dimension => {
            candidates.push(this.randomChoice<Candidate>(dimension))
        });
        const loss = this.loss_function(candidates);
        return new Improvisation(candidates,loss);
    }

    public test_and_replace(improvisation:Improvisation){
        const worst_improvisation = this.HM.reduce((prev, current) => (prev.loss > current.loss) ? prev : current)
    
        if(worst_improvisation.loss > improvisation.loss){

            const idx = this.HM.indexOf(worst_improvisation);

            this.HM[idx] = improvisation;
        }
    }

    public create_improvisation():Improvisation{
        const candidates:Candidate[] = []

        for(let index = 0; index< this.candidate_space.length; index++){
            let candidate = null;
            if(Math.random() < this.HMCR){
                candidate = this.randomChoice<Candidate>(this.HM.map(imp=>imp.candidates[index]))
                if(Math.random() < this.PAR){
                    candidate = this.pitch_adjustment(candidate)
                }
            }else{
                candidate = this.randomChoice<Candidate>(this.candidate_space[index])
            }
            candidates.push(candidate);
        }

        const loss = this.loss_function(candidates);
        return new Improvisation(candidates,loss);
    }

    public pitch_adjustment(candidate:Candidate):Candidate{
        const dim_len = candidate.dimension.length
        if(candidate.index == 0 && dim_len > 1){
            return candidate.dimension[1];
        }else if(candidate.index == dim_len-1 && dim_len > 1){
            return candidate.dimension[dim_len-2]
        }else if(dim_len > 2){
            if( Math.random() >= 0.5){
                return candidate.dimension[candidate.index+1];
            }else{
                return candidate.dimension[candidate.index-1];
            }
        }
        return candidate;
    }

}