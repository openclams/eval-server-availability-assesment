import {ComponentLabelledTransitionSystem} from '../model/LTS/ComponentLabelledTransitionSystem';
import {LTSTransition} from '../model/LTS/LTSTransition';
import {StateType} from '../enums/StateType';
import {State} from '../model/LTS/State';
import {StateTransition} from '../model/LTS/StateTransition';
import {MinimalLTS} from '../model/LTS/MinimalLTS';

export class Minimizer {
    public static epsilon = 0.000000001;

    public static minimize(clts: ComponentLabelledTransitionSystem) {
        // get all states except error states
        const allStates = clts.labelledTransitionSystems.map(x => x.states)
            .reduce((previousValue, currentValue) => previousValue.concat(currentValue), [])
            .filter(s => {
                return s.type !== StateType.Error;
            });
        const initLTS = clts.labelledTransitionSystems.find(lts => {
            return lts.initial;
        });
        const finalLTS = clts.labelledTransitionSystems.find(lts => {
            return lts.final;
        });

        const initState = initLTS.states.find(s => {
            return s.type === StateType.Initial;
        });

        const finalState = finalLTS.states.find(s => {
            return s.type === StateType.End || finalLTS.states.length === 1;
        });

        // direct all error transitions to a single error state
        const errorState = new State(-1, StateType.Error, -1, 'Error');
        clts.labelledTransitionSystems.map(x => x.transitions).reduce((previousValue, currentValue) => previousValue.concat(currentValue), []).filter(e => {
            return e.destination.type === StateType.Error;
        }).forEach(e => {
            e.destination = errorState;
            errorState.stateTransitionsIn.push(e);
        });
        // add new error state to the array
        allStates.push(errorState);

        // add a final state to the lts
        const newFinalState = new State(0, StateType.Final, -1, 'Final');
        const finalTrans = new StateTransition(0, 1, finalState, newFinalState, 'Final', finalState.componentIDX, finalState.componentIDX, newFinalState.componentIDX);
        newFinalState.stateTransitionsIn.push(finalTrans);
        finalState.stateTransitionsOut.push(finalTrans);
        allStates.push(newFinalState);
        this.removeSelfLoops(clts);
        this.handleState(initState, allStates, clts, true);
        allStates.filter(s => {
            return s !== initState && s.type === StateType.Initial;
        }).forEach(s => {
            this.removeSelfLoops(clts);
            this.handleState(s, allStates, clts, false);
        });
        this.removeSelfLoops(clts);
        // removes all undefined entries and those which do not have any more edges in or out
        let minimalStates = allStates.filter(s => {
            return s !== undefined && (s.stateTransitionsIn.length + s.stateTransitionsOut.length > 0);
        });
        // normalize
        Minimizer.normalize(minimalStates);


        // combine states that have the exact same outgoing edges to one
        // therefore we keep one and give him all ingoing edges
        // before we move init init state to beginning of array so it does not get removed
        minimalStates = minimalStates.filter(s => s !== initState);
        minimalStates.unshift(initState);
        this.combineIdenticalStates(minimalStates);
        this.combineIdenticalTransitions(minimalStates);
        return new MinimalLTS(clts.componentIDX, minimalStates, initState, newFinalState);
    }

    private static removeLTSTransition(transition: LTSTransition, clts: ComponentLabelledTransitionSystem) {
        // delete in clts
        let index = clts.transitions.indexOf(transition);
        if (index !== -1) {
            clts.transitions.splice(index, 1);
        }
        // delete in state
        const destState = transition.destinationState;
        index = destState.ltsTransitionsIn.indexOf(transition);
        if (index !== -1) {
            destState.ltsTransitionsIn.splice(index, 1);
        }
        const sourceState = transition.sourceState;
        index = sourceState.ltsTransitionsOut.indexOf(transition);
        if (index !== -1) {
            sourceState.ltsTransitionsOut.splice(index, 1);
        }
    }

    private static removeStateTransition(transition: StateTransition) {
        const sourceState = transition.source;
        const destState = transition.destination;
        let index = sourceState.stateTransitionsOut.indexOf(transition);
        if (index !== -1) {
            sourceState.stateTransitionsOut.splice(index, 1);
        }
        index = destState.stateTransitionsIn.indexOf(transition);
        if (index !== -1) {
            destState.stateTransitionsIn.splice(index, 1);
        }
    }

    private static addStateTransition(transition: StateTransition) {
        const sourceState = transition.source;
        const destState = transition.destination;
        sourceState.stateTransitionsOut.push(transition);
        destState.stateTransitionsIn.push(transition);
    }

    private static addLTSTransition(transition: LTSTransition, clts: ComponentLabelledTransitionSystem) {
        const sourceState = transition.sourceState;
        const destState = transition.destinationState;
        sourceState.ltsTransitionsOut.push(transition);
        destState.ltsTransitionsIn.push(transition);
        clts.transitions.push(transition);

    }

    private static removeState(state: State, allStates: State[]) {
        const index = allStates.indexOf(state);
        allStates[index] = undefined;
    }

    private static normalize(states: State[]) {
        states.forEach(s => {
            const sumProb = s.stateTransitionsOut.map(e => e.probability).reduce((a, b) => a + b, 0);
            s.stateTransitionsOut.forEach((x) => {
                x.probability = x.probability / sumProb;
            });
        });
    }

    private static isIdentical(s1: State, s2: State): boolean {
        if (s1.type === StateType.Final || s1.type === StateType.Error) return false;
        let b1 = s1.stateTransitionsOut.length === s2.stateTransitionsOut.length;
        if (!b1) return false;
        const dest2 = s2.stateTransitionsOut.map(t => {
            return t.destination;
        });
        s1.stateTransitionsOut.map(t => {
            return t.destination;
        }).forEach(d => {
            if (b1) {
                b1 = dest2.indexOf(d) > -1;
            }
        });

        s1.stateTransitionsOut.forEach(t => {
            if (b1) {
                let index = dest2.indexOf(t.destination);
                b1 = index > -1 && Math.abs(s2.stateTransitionsOut[index].probability - t.probability) < this.epsilon;
            }
        });
        return b1;


    }

    private static combineIdenticalStates(states: State[]) {
        // find identical states
        let idents: [State, State][] = [];
        states.forEach((s1, index) => {
            states.slice(index + 1).forEach((s2) => {
                if (Minimizer.isIdentical(s1, s2)) {
                    idents.push([s1, s2]);
                }
            });
        });
        idents.forEach(value => {
            let index = states.indexOf(value[1]);
            if (index !== -1) {
                states.splice(index, 1);
            }
            value[1].stateTransitionsOut.forEach(e => {
                let index = e.destination.stateTransitionsIn.indexOf(e);
                if (index !== -1) {
                    e.destination.stateTransitionsIn.splice(index, 1);
                }
            });
            value[1].stateTransitionsIn.forEach(e => {
                e.destination = value[0];
                value[0].stateTransitionsIn.push(e);
            });
        });
    }

    private static removeSelfLoops(clts: ComponentLabelledTransitionSystem) {
        const selfLoops = clts.transitions.filter(e => {
            return e.sourceState === e.destinationState;
        });

        selfLoops.forEach(x => Minimizer.removeLTSTransition(x, clts));
    }


    private static handleState(s: State, allStates: State[], clts: ComponentLabelledTransitionSystem, initial: boolean) {
        // check all ltsTransitions in
        s.ltsTransitionsIn.forEach(ltsTransIn => {
            // connect it with the ltsTransitions out
            s.ltsTransitionsOut.forEach(ltsTransOut => {
                const newProb = ltsTransIn.probability * ltsTransOut.probability;
                const newLTSTrans = new LTSTransition(ltsTransOut.componentIDX, newProb, ltsTransIn.sourceState, ltsTransOut.destinationState, ltsTransIn.sourceLTS, ltsTransOut.destinationLTS);
                Minimizer.addLTSTransition(newLTSTrans, clts);
            });
            // and connect it with the state transitions out
            s.stateTransitionsOut.forEach(stateTransOut => {
                const newProb = ltsTransIn.probability * stateTransOut.probability;
                const newStateTrans = new StateTransition(stateTransOut.id, newProb, ltsTransIn.sourceState, stateTransOut.destination, stateTransOut.graphID, stateTransOut.componentIDX, stateTransOut.sourceComponentIDX, stateTransOut.targetComponentIDX);
                Minimizer.addStateTransition(newStateTrans);
            });

        });
        if (initial) {
            s.ltsTransitionsIn.forEach(t => {
                Minimizer.removeLTSTransition(t, clts);
            });
            return;
        }
        s.ltsTransitionsIn.concat(s.ltsTransitionsOut).forEach(t => {
            Minimizer.removeLTSTransition(t, clts);
        });
        s.stateTransitionsIn.concat(s.stateTransitionsOut).forEach(t => {
            Minimizer.removeStateTransition(t);
        });
        Minimizer.removeState(s, allStates);

    }


    private static combineIdenticalTransitions(states: State[]) {
        states.forEach(s => {
            const distinctDests = s.stateTransitionsOut.map(s => s.destination).filter((value, index, array) => array.indexOf(value) === index).filter(value => {
                return value.type !== StateType.Error;
            });
            distinctDests.forEach(dest => {
                const idents = s.stateTransitionsOut.filter(t => {
                    return t.destination === dest;
                });
                this.combineTransitions(idents);
            });
        });


        states.forEach(s => {
            const errorTrans = s.stateTransitionsOut.filter(t => t.destination.type === StateType.Error);
            const distinctErrorTrans = errorTrans.filter(t => t === errorTrans.find(et => et.sourceComponentIDX === t.sourceComponentIDX && et.targetComponentIDX === t.targetComponentIDX && et.componentIDX === t.componentIDX && et.graphID === t.graphID && et.id === t.id));
            distinctErrorTrans.forEach(det => {
                const idents = errorTrans.filter(t => t.componentIDX === det.componentIDX && t.sourceComponentIDX === det.sourceComponentIDX && t.targetComponentIDX === det.targetComponentIDX && t.graphID === det.graphID && t.id ===det.id);
                this.combineTransitions(idents);
            });
        });
    }

    private static combineTransitions(trans: StateTransition[]) {
        if (trans.length < 2) return;
        const sum = trans.map(t => t.probability).reduce((previousValue, currentValue) => previousValue + currentValue, 0);
        trans[0].probability = sum;
        trans.slice(1).forEach(t => {
            Minimizer.removeStateTransition(t);
        });
    }
}
