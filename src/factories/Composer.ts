import {MinimalLTSCollection} from '../model/LTS/MinimalLTSCollection';
import {CompositeState} from '../model/Composition/CompositeState';
import {State} from '../model/LTS/State';
import {StateTransition} from '../model/LTS/StateTransition';
import {CompositeTransition} from '../model/Composition/CompositeTransition';
import {StateType} from '../enums/StateType';

export class Composer {

    public static compose(mins: MinimalLTSCollection) {
        const frontier = [];
        const compStates: CompositeState[] = [];
        const initStaes = mins.MinimalLTSs.map(m => m.initialState);
        frontier.push(new CompositeState(initStaes));
        while (frontier.length > 0) {
            const node = frontier.shift();
            compStates.push(node);
            if (Composer.isFinalCompState(node)) continue;
            this.getNextCompStates(mins, node).forEach(t => {
                node.transitionsOut.push(t);
                if (t.isErrorTransition) return;
                const existingState = this.isAlreadyExplored(compStates, t.to);
                if (existingState === undefined) {
                    frontier.push(t.to);
                    return;
                }
                t.to = existingState;
            });
        }
        const finalState = compStates.find(c => c.states[0].type === StateType.Final);

        Composer.normalize(compStates);

        // since there might be duplicate states that lead to the end-action state we combine them, since there can only
        // be one
        this.eliminateDuplicateStates(compStates, finalState);

        return compStates;
    }

    private static isEqual(a1: State[], a2: State[]) {
        for (let i = 0; i < a1.length; i++) {
            if (!a2.includes(a1[i])) {
                return false;
            }
        }
        return true;
    }

    private static isFinalCompState(compState: CompositeState) {
        return compState.states[0].type === StateType.Final;
    }

    private static createFinalState(mins: MinimalLTSCollection) {
        return new CompositeState(mins.MinimalLTSs.map(min => min.finalState));
    }

    private static normalize(states: CompositeState[]) {
        states.forEach(s => {
            const sumProb = s.transitionsOut.map(e => e.probability).reduce((a, b) => a + b, 0);
            s.transitionsOut.forEach(x => {
                x.probability = x.probability / sumProb;
            });
        });
    }

    private static getNextCompStates(mins: MinimalLTSCollection, compState: CompositeState) {
        // get all transitions from all current states
        // check if there are doubles
        // these are possible
        let allTrans = ([] as StateTransition[]).concat(...compState.states.map(s => s.stateTransitionsOut));
        const compTrans: CompositeTransition[] = [];
        if (allTrans.filter(t => t.destination.type === StateType.Final).length === compState.states.length) {
            const newState = Composer.createFinalState(mins);
            const newTrans = new CompositeTransition(compState, newState, 1);
            compTrans.push(newTrans);
            return compTrans;
        }
        const transPair: StateTransition[][] = [];
        const errorTrans = allTrans.filter(t => t.destination.type === StateType.Error);
        const filteredTrans = allTrans.filter(t => t.destination.type !== StateType.Error && t.destination.type !== StateType.Final);
        filteredTrans.forEach(t => {
            let index = filteredTrans.indexOf(t);
            const fromComp = t.sourceComponentIDX;
            const toComp = t.targetComponentIDX;
            const graphID = t.graphID;
            const id = t.id
            const transPartner = filteredTrans.slice(index + 1).find(tp => {
                return tp.graphID === graphID && tp.targetComponentIDX === toComp && tp.sourceComponentIDX === fromComp&& tp.id === id;
            });
            if (transPartner !== undefined) {
                transPair.push([t, transPartner]);
            }
        });
        transPair.forEach(pair => {
            const states = [...compState.states];
            const index1 = states.indexOf(pair[0].source);
            const index2 = states.indexOf(pair[1].source);
            states[index1] = pair[0].destination;
            states[index2] = pair[1].destination;
            const prob = pair[0].probability * pair[1].probability;
            const newState = new CompositeState(states);
            const newTrans = new CompositeTransition(compState, newState, prob);
            compTrans.push(newTrans);
            // const errorTrans = undefined
            // select which of the two is the one that sends the transitions
            const sender = pair.find(t => t.componentIDX === t.sourceComponentIDX);
            // find the corresponding error transition
            const err = errorTrans.find(t => t.sourceComponentIDX === pair[0].sourceComponentIDX && t.targetComponentIDX === pair[0].targetComponentIDX &&
                t.graphID === pair[0].graphID && t.id === pair[0].id);
            // multiply the probabilities of those two transitions
            const errorProb = sender.probability * err.probability;
            // add a new compTrans to arr that has the isErrorTransition flag set
            const newErrorTrans = new CompositeTransition(compState, undefined, errorProb, true);
            compTrans.push(newErrorTrans);
        });
        return compTrans;

    }

    private static isAlreadyExplored(explored: CompositeState[], compState: CompositeState) {
        return explored.find(s => {
            return Composer.isEqual(s.states, compState.states);
        });
    }

    private static eliminateDuplicateStates(compStates: CompositeState[], finalState: CompositeState) {
        const states = compStates.filter(cs => cs.transitionsOut.length > 0 && cs.transitionsOut[0].to === finalState);
        if (states.length < 2) return;
        const realState = states[0];
        const dubs = states.slice(1);
        // check which states lead to an duplicate state
        const allTrans = ([] as CompositeTransition[]).concat(...compStates.map(cs => cs.transitionsOut));
        allTrans.filter(t => dubs.includes(t.to)).forEach(t => {
            t.to = realState;
        });
        dubs.forEach(d => {
            const index = compStates.indexOf(d);
            if (index !== -1) {
                compStates.splice(index, 1);
            }
        });

    }
}
