import {State} from './State';

export class StateTransition {

    // represents the index in the model
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
