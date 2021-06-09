import express from 'express';
import cors from 'cors';
import {Service, Model, ModelFactory } from '@openclams/clams-ml';
import JsonReplacementProtocol from './json-replacement-protocol';
import SearchSpace from './search-space';
import {ComponentLabelledTransitionsSystemsFactory} from './factories/LTS/ComponentLabelledTransitionsSystemsFactory';
import {Composer} from './factories/Composer';
import {MinimalLTSCollectionFactory} from './factories/LTS/MinimalLTSCollectionFactory';
import {MatrixFactory} from './factories/MatrixFactory';
import JsonReplacementComponent from './json-replacement-component';
import Search from './harmony-search/search';
import Candidate from './harmony-search/candidate';
import {listAllComponentOptions, replace, arraysEqual} from './utils';
import { Replacement, Result, Value } from './result';
import Improvisation from './harmony-search/improvisation';
import * as fs from 'fs';
import { resetTimer, startTimer, stopTimer } from './timer';

const stats = require("stats-lite");


let bound = 0.948; 

function setBound(b:number){
    bound = b;
}

function getBound(){
    return bound;
}


function serializeReplacementList(replacements: Replacement[]):JsonReplacementComponent[]{

    return replacements.filter(c=>c).map(replacement => {
    
        return {
    
            componentIdx: replacement.index,
    
            replaceWith: replacement.suggestion.id
    
        }
    }); 
}




function computeAvailability(model:Model):number{


    // with this we calculate the Component Labelled Transitions system for all components in the model
    const cltss = ComponentLabelledTransitionsSystemsFactory.getComponentLabelledTransitionSystems(model);

    // this miminizes the cltss
    const mins = MinimalLTSCollectionFactory.getMinimalLTSCollectionFactory(cltss);

    // this composes the cltss into one big lts
    const c = Composer.compose(mins);

    //here we get the matrix for cheung and also calculate the reliability as well
    // the name could be changed actually
    return MatrixFactory.getMatrix(c);
}

function computeCost(model:Model):number{
    const result = model.components.map(cw => {

        const component = cw.component;

        if(component instanceof Service){

            if(component.costs && component.costs[0] && component.costs[0].cost) 
                return parseFloat(component.costs[0].cost.toString());
            else 
                return 1; 
        }

        return Infinity;
    });

    return result.reduce((prev,curr) => {

        return curr+prev

    },0);
}


function replaceComponents( indexList:number[], searchSpace:SearchSpace[], model:Model ):Model{

    const copyModel = model;//ModelFactory.copy(model);
  
    indexList.forEach((val,i) =>{

        const alternative = searchSpace[i].refinements[val];

        replace(searchSpace[i].index ,alternative,copyModel); 

    });
    
    return copyModel;
}

function evaluate(model:Model):Value{
    startTimer('ComputationTime');
    const availability = computeAvailability(model);

    const cost = computeCost(model);
    
    return {
        availability,
        cost,
        loss: Infinity,
        time: stopTimer('ComputationTime')
    };
}

function loss(values:Value):number{

    if(values.availability >= getBound()){

        return values.loss =  values.cost;

    }

    return Infinity;
}

/**
 * Skeleton for implementing an evaluation algorithm
 *
 * In the follwoing, we provide some examples how to use models
 * and replace components in the model.
 *
 * @param searchSpace The list of replacement options
 */
function algorithm(model: Model, searchSpace: SearchSpace[]):Result {

    const counts:number[] = searchSpace.map(_=>0);

    const termination_criteria:number[] = searchSpace.map(s=>s.refinements.length-1);

    startTimer('TimeMeasurementForHS');    
    
    let newModel = replaceComponents(counts,searchSpace,model);
    
    let values = evaluate(newModel);
    
    let minimal_loss = loss(values);
    
    let best_suggestion = Object.assign([], counts);
    
    let best_result = values;
    
    let l = 0;
    
    // prettyPrint(best_suggestion,
    //             searchSpace,
    //             minimal_loss,
    //             values.availability);
    
    while(!arraysEqual(counts,termination_criteria)){

        for(let a = 0; a < counts.length; a++){

            if( a == 0){

                counts[a] += 1;
                
            }else{

                if (counts[a-1] > termination_criteria[a-1]){

                    counts[a-1] = 0;

                    counts[a] += 1;
                }
            }  
        }

        newModel = replaceComponents(counts,searchSpace,model);

        values = evaluate(newModel);

        l = loss(values);

        if(minimal_loss > l){

                minimal_loss = l

                best_result = values;

                best_suggestion = Object.assign([], counts);
        }
        //console.log(counts);
        //prettyPrint(counts, searchSpace, l,values.availability );
    }

    const FullScanTime = stopTimer('TimeMeasurementForHS')
    resetTimer('TimeMeasurementForHS')

    const total_posibilities = searchSpace.map(s=>s.refinements.length).filter(c=> c != 0).reduce((sum, current) => sum * current, 1);

    console.log(
        minimal_loss, 
        best_result.availability,
        FullScanTime,
        total_posibilities
        )

    const replacements: Replacement[] = searchSpace.map((suggestion,idx) => {

        return {
            index: suggestion.index,
            component: suggestion.component,
            suggestion: suggestion.refinements[best_suggestion[idx]]
        };
    });

    return {
        values,
        replacements
    }
    
}

function lossHS(candidates: Candidate[]):number{

    const model = candidates[0].value.model;

    candidates.forEach((candidate) =>{

        //console.log(candidate);

        replace(candidate.value.cidx, candidate.value.component, candidate.value.model); 

    });

    let result = evaluate(model);

    candidates[0].value['result'] = result;

    return loss(result);
}


function searchSpace2candidateSpace(searchSpace: SearchSpace[],model: Model):Candidate[][]{

    return searchSpace.map((dimension)=>{
    
        return dimension.refinements.map((suggestion)=>{
    
            const c =  new Candidate();
    
            c.value = { 
                /**
                 * The position in the model.component list for which we 
                 * whish to replace
                 */
                cidx : dimension.index, 
                component : suggestion,
                model: model
            };
    
            return c;
        });
    });
}

function  algorithmHS(model: Model, 
                        candidateSpace: Candidate[][],  
                        harmony_memory_size = 5,
                        harmony_memory_consideration_rate = 0.95, 
                        pitch_adjustment_rate = 0.1,
                        termination = 1000):Result {

  

    const hs = new Search(  candidateSpace,
                            lossHS, 
                            harmony_memory_size,
                            harmony_memory_consideration_rate,
                            pitch_adjustment_rate,
                            termination);
    
    startTimer('TimeMeasurementForHS');    
    const bestSolution = hs.run();
    const HSTime = stopTimer('TimeMeasurementForHS')
    resetTimer('TimeMeasurementForHS')
    
    const total_posibilities =  candidateSpace.map(c=> c.length).filter(c=> c != 0).reduce((sum, current) => sum * current, 1);

    console.log(harmony_memory_size,
        harmony_memory_consideration_rate,
        pitch_adjustment_rate, 
        termination,
        bestSolution.candidates[0].value['result'].loss, 
        bestSolution.candidates[0].value['result'].availability,
        HSTime,
        total_posibilities
        )
    
    const replacements: Replacement[] = bestSolution.candidates.map((solution,idx) => {
        return {
            index: solution.value.cidx,
            component: model.components[solution.value.cidx].component,
            suggestion: solution.value.component
        };
    });
    return {
        values:  bestSolution.candidates[0].value['result'],
        replacements
    }
    
}


async function test(){

    for(let i = 1; i < 2; i++){
        
        const rawModel = fs.readFileSync("./src/tests/"+i+".json")
        
        let c = JSON.parse(rawModel.toString());
        //console.log(m['model']);

        const model:Model = ModelFactory.fromJSON(c.model);
        
        const searchSpace =  await listAllComponentOptions(model)

        const total_posibilities = searchSpace.map(s=>s.refinements.length).filter(c=> c != 0).reduce((sum, current) => sum * current, 1);

        if(i == 19 || i == 24 || i == 22){
        
            setBound(0.93)

        }else{

            setBound(0.948)
       
        }

        console.log('\n\n->',i)

        let searchEngine:Result = null;
 

        if(total_posibilities < 50000000){
        
            console.log("Exhaustive Search")

            searchEngine = algorithm(model, searchSpace);

            resetTimer('ComputationTime')
        }

        console.log("Harmony Search")

        const candidateSpace = searchSpace2candidateSpace(searchSpace, model);

        const pcrs = [0.05,0.1,0.2,0.4]
        const hms = [10,100,1000]
        const term = [5000,10000,50000]
        const hmcrs = [0.80,0.85,0.9, 0.95]
        for (let pcr of pcrs) {
            for (let hm of hms) {
                for (let t of term) {
                    for (let hmcr of hmcrs) {

                        searchEngine = algorithmHS(model,candidateSpace, hm, hmcr,  pcr, t);
                        
                        resetTimer('ComputationTime');
                    }
                }
            }
        }   
    }

}

/**
 * Start test when no args are given
 */
if(process.argv.length == 2){

    test();

}


function mostFrequentResult(results:Result[]):Result
{
    if(results.length == 0){
        return null;
    }
    
    let modeMap:Record<string,number> = {};

    let maxEl = results[0]
    
    let maxCount = 1;
    
    for(var i = 0; i < results.length; i++)
    {
        const l:string = results[i].values.loss.toString();
    
        if(modeMap[l] == null){
        
            modeMap[l] = 1;
        
        }else{
          
            modeMap[l]++;
        
        }  

        if(modeMap[l] > maxCount){
        
            maxEl = results[i];
        
            maxCount = modeMap[l];
        }
    }
    return maxEl;
}


/**
 * If the first argument is web, the application starts the express server.
 * The follow up argument is intepreted as the port number.
 */
if((process.argv.length == 3 || process.argv.length == 4) && process.argv[2] == 'web'){
    /**
     * Start the express server
     */
     const app = express();

     /**
      * Default port to listen
      */
     let port = 8085;
    
     /**
      * Activate CROS to allow corss origin acces for the web-app
      */
     app.use(cors());
    
     /**
      * Parse  x-www-form-urlencoded data
      */
     app.use(express.urlencoded({ extended: true }));
    
     /**
      * Parse JSON data
      */
     app.use(express.json());

     app.post('/', async (req, res) => {
    
        const model = ModelFactory.fromJSON(req.body.model);

        console.log('Availability' , req.body.availability)

        setBound(parseFloat(req.body.availability)/100)
    
        const searchSpace = await listAllComponentOptions(model);
    
        startTimer('approx');

        const candidateSpace = searchSpace2candidateSpace(searchSpace, model);

        const HMS = model.components.length * 2
        const iterations = 10000

        let results:Result[]  = []

        for(let i = 0; i < 1; i++){

            results.push(algorithmHS(model,candidateSpace, HMS, 0.85,  0.1, iterations));

        }

        console.log("Approx time:" ,stopTimer('approx'));
    
        resetTimer('approx');

        let result:Result = mostFrequentResult(results)

        res.json({
        
            result: 'Availaiblity: '+result.values.availability.toString()+' Cost: '+result.values.cost.toString(),
        
            replacements: serializeReplacementList(result.replacements)
        
        } as JsonReplacementProtocol);
    });

    if(process.argv.length == 4){

        port = parseInt(process.argv[3])
    
    }

    app.listen(port, () => {

        console.log(`server started at http://localhost:${port}`);

    });  
}



