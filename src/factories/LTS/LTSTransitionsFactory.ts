import {LTSTransition} from '../../model/LTS/LTSTransition';
import {Arrow, Model, State} from '@openclams/clams-ml';
import {LabelledTransitionSystem} from '../../model/LTS/LabelledTransitionSystem';
import {GraphType} from '../../enums/GraphType';

export class LTSTransitionsFactory {

    static getLTSTransitions(model: Model, componentIDX: number, LTSs: LabelledTransitionSystem[]): Array<LTSTransition> {
        const transitions = new Array<LTSTransition>();
        const userProfile = model.graphs.find(x => x.getType() === GraphType.UserProfile);
        if (userProfile === undefined) return transitions;
        userProfile.edges.filter((edge: Arrow) => {
            return edge.from.id !== 'Dot0';
        }).forEach((edge: Arrow) => {
            const fromLTS = LTSs.find(x => x.graphID === (edge.from as State).sequenceDiagram.id);
            const fromState = fromLTS.finalState;
            const toLTS = LTSs.find(x => x.graphID === (edge.to as State).sequenceDiagram.id);
            const toState = toLTS.initialState;
            const prop = edge.probability;
            const newLTSTransition = new LTSTransition(componentIDX, prop, fromState, toState, fromLTS, toLTS);
            fromState.ltsTransitionsOut.push(newLTSTransition);
            toState.ltsTransitionsIn.push(newLTSTransition);
            fromLTS.edgesOut.push(newLTSTransition);
            toLTS.edgesIn.push(newLTSTransition);
            transitions.push(newLTSTransition);
        });
        const nameOfInitialLTS = (userProfile.edges.find(x => x.from.id === 'Dot0').to as State).sequenceDiagram.id;
        LTSs.find(x => x.graphID === nameOfInitialLTS).initial = true;
        const nameOfNonFinalLTS = userProfile.edges.map(x => x.from.id);
        //check which lts has no outgoing edges, that must be the final node
        const nameOfFinalLTS = (userProfile.nodes.find((x) => !nameOfNonFinalLTS.includes(x.id)
        ) as State).sequenceDiagram.id;
        LTSs.find(x => x.graphID === nameOfFinalLTS).final = true;

        return transitions;
    }
}
