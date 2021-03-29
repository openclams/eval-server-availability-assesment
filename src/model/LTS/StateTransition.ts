import {State} from './State';

export class StateTransition {

    // the id represents how many times a transaction from the same component to the same other component happened before this.
    // in the boiler example all ids should be 0 since in no scenario a components sends a double message to the same other component
    id: number;


    probability: number;
    source: State;
    destination: State;
    sourceComponentIDX: number;
    targetComponentIDX: number;
    graphID: String;
    componentIDX: number;


    constructor(id: number, probability: number, source: State, destination: State, graphID: String, componentIDX: number, sourceComponentIDX: number, targetComponentIDX: number) {
        this.id = id;
        this.probability = probability;
        this.source = source;
        this.destination = destination;
        this.graphID = graphID;
        this.componentIDX = componentIDX;
        this.sourceComponentIDX = sourceComponentIDX;
        this.targetComponentIDX = targetComponentIDX;
    }
}
