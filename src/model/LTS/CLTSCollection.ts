import {ComponentLabelledTransitionSystem} from './ComponentLabelledTransitionSystem';

export class CLTSCollection{
    componentLabelledTransitionSystems: ComponentLabelledTransitionSystem[]

    constructor(componentLabelledTransitionSystems: ComponentLabelledTransitionSystem[]) {
        this.componentLabelledTransitionSystems = componentLabelledTransitionSystems;
    }
}
