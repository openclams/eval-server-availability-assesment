import {StateType} from '../../enums/StateType';
import {StateTransition} from './StateTransition';
import {LTSTransition} from './LTSTransition';

export class State {
    id: number;
    type: StateType;
    stateTransitionsIn: StateTransition[];
    stateTransitionsOut: StateTransition[];
    ltsTransitionsIn: LTSTransition[];
    ltsTransitionsOut: LTSTransition[];
    componentIDX: number;
    graphID: string;


    constructor(id: number, type: StateType, componentIDX: number, graphID: string) {
        this.componentIDX = componentIDX;
        this.graphID = graphID;
        this.id = id;
        this.type = type;
        this.stateTransitionsIn = [];
        this.stateTransitionsOut = [];
        this.ltsTransitionsIn = [];
        this.ltsTransitionsOut = [];
    }
}
