import Candidate from "./candidate";

/**
 * Wrapper class to represent an 
 * particular combination of the search speach
 * including the loss
 */
export default class Improvisation{

    /**
     * Associate a loss to a particular
     * candidate combination
     */
    public loss: number;

    /**
     * Reference to the candidates
     */
    public candidates: Candidate[];

    constructor(candidates: Candidate[],loss:number){
        this.candidates = candidates;
        this.loss = loss;
    }

}