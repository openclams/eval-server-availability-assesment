import {LabelledTransitionSystem} from './LabelledTransitionSystem';
import {LTSTransition} from './LTSTransition';
export class ComponentLabelledTransitionSystem {
    labelledTransitionSystems: LabelledTransitionSystem[];
    transitions: LTSTransition[];
    componentIDX: number;


    constructor(labelledTransitionSystems: LabelledTransitionSystem[], transitions: LTSTransition[], componentIDX: number) {
        this.labelledTransitionSystems = labelledTransitionSystems;
        this.transitions = transitions;
        this.componentIDX = componentIDX;
    }

}
