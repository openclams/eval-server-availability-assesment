import {LabelledTransitionSystem} from './LabelledTransitionSystem';
import {LTSTransition} from './LTSTransition';
import {State} from './State';
import {MinimalLTS} from './MinimalLTS';

export class ComponentLabelledTransitionSystem {
    labelledTransitionSystems: LabelledTransitionSystem[];
    transitions: LTSTransition[];
    componentIDX: number;


    constructor(labelledTransitionSystems: LabelledTransitionSystem[], transitions: LTSTransition[], componentIDX: number) {
        this.labelledTransitionSystems = labelledTransitionSystems;
        this.transitions = transitions;
        this.componentIDX = componentIDX;
    }

    private static removeLTSTransition(transition: LTSTransition) {
        let index = transition.destinationState.ltsTransitionsIn.indexOf(transition);
        if (index !== -1) {
            transition.destinationState.ltsTransitionsIn.splice(index, 1);
        }
        index = transition.sourceState.ltsTransitionsOut.indexOf(transition);
        if (index !== -1) {
            transition.sourceState.ltsTransitionsOut.splice(index, 1);
        }
    }

    private static removeState(state: State, lts: LabelledTransitionSystem) {
        const index = lts.states.indexOf(state);
        if (index != -1) {
            lts.states.splice(index, 1);
        }
    }

    public minimize() {
        this.transitions.forEach(t => {
            this.mergeStates(t);
        });

        // now we get all states and state transitions that are left
        const minimalStates = this.labelledTransitionSystems.map(x => x.states).reduce((previousValue, currentValue) => previousValue.concat(currentValue), []);
        const minimalTransitions = this.labelledTransitionSystems.map(x => x.transitions).reduce((previousValue, currentValue) => previousValue.concat(currentValue), []);
        // normalize edges
        minimalStates.forEach(s => {
            const sumProb = s.stateTransitionsOut.map(e => e.probability).reduce((a, b) => a + b, 0);
            s.stateTransitionsOut.forEach((x) => {
                x.probability = x.probability / sumProb;
            });
        });
        // we get the initial and end state over all
        // we combine all error states to one


        return new MinimalLTS(this.componentIDX, minimalStates, minimalTransitions);
    }

    // merging two states as described in rodriues paper
    private mergeStates(transition: LTSTransition) {
        // delete the LTS transition
        const source = transition.sourceState;
        const target = transition.destinationState;
        ComponentLabelledTransitionSystem.removeLTSTransition(transition);
        // if the transition is a self loop we do not have to do anything else
        if (source === target) {
            return;
        }

        // now we remove the target state from our lts.state array
        ComponentLabelledTransitionSystem.removeState(target, transition.destinationLTS);

        // now we give all state transition from the target state to the source state
        // we only have to consider outgoing edges
        // but before that we have to multiply the lts transition prob with the state transition prob
        target.stateTransitionsOut.forEach(e => {
            e.probability = e.probability * transition.probability;
            e.source = source;
        });
        source.stateTransitionsOut = source.stateTransitionsOut.concat(target.stateTransitionsOut);
        // now the incoming edges
        target.stateTransitionsIn.forEach(e => {
            e.destination = source;
        });
        source.stateTransitionsIn = source.stateTransitionsIn.concat(target.stateTransitionsIn);

        // now we give all the lts transitions of the target state to the source state
        // here we also have to adjust the probabilities
        // first the outgoing edges
        target.ltsTransitionsOut.forEach(e => {
            e.probability = e.probability * transition.probability;
            e.sourceState = source;
            e.sourceLTS = transition.sourceLTS;
        });
        source.ltsTransitionsOut = source.ltsTransitionsOut.concat(target.ltsTransitionsOut);

        // now the incoming edges
        target.ltsTransitionsIn.forEach(e => {
            e.destinationState = source;
            e.destinationLTS = transition.sourceLTS;
        });
        source.ltsTransitionsIn = source.ltsTransitionsIn.concat(target.ltsTransitionsIn);

    }


}
