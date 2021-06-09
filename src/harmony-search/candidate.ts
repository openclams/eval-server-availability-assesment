/**
 * Wrapper to enclose objects to be used
 * with the HS algorithm
 */
export default class Candidate{
    /**
     * Reference to the object  
     */
    public value: any;
    
    /**
     * Position within the candidate list
     * of the improvisation 
     */
    public index: number;
    
    /**
     * Reference to the other candidates within
     * the improvisation
     */
    public dimension: Candidate[];

    constructor() {
        this.dimension = [];
     } 
}