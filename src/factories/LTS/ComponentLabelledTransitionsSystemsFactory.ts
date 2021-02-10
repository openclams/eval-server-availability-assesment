import {Model} from '@openclams/clams-ml';
import {ComponentLabelledTransitionSystem} from '../../model/LTS/ComponentLabelledTransitionSystem';
import {LabelledTransitionSystemsFactory} from './LabelledTransitionSystemsFactory';
import {LTSTransitionsFactory} from './LTSTransitionsFactory';

export class ComponentLabelledTransitionsSystemsFactory {

    static getComponentLalelledTransitionSystems(model: Model): Array<ComponentLabelledTransitionSystem> {
        const cltss = new Array<ComponentLabelledTransitionSystem>();
        for (let i = 0; i < model.components.length; i++) {
            const newLTSs = LabelledTransitionSystemsFactory.getLabelledTransitionSystems(model, i);
            const newLTSTransitions = LTSTransitionsFactory.getLTSTransitions(model, i, newLTSs);
            cltss.push(new ComponentLabelledTransitionSystem(newLTSs, newLTSTransitions, i));
        }
        return cltss;
    }
}
