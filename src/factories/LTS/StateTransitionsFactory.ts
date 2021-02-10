import {Graph, Model} from '@openclams/clams-ml';
import {StateTransition} from '../../model/LTS/StateTransition';
import {State} from '../../model/LTS/State';

export class StateTransitionsFactory {
    static getTransitions(model: Model, componentIDX: number, graph: Graph, states: State[]): Array<StateTransition> {
        const transitions = new Array<StateTransition>();
        const component = model.components[componentIDX].instances.find(instance => {
                return instance.graph.id === graph.id;
            }
        );
        let instanceIDXMap = new Map();
        model.components.forEach((c, index) => {
            const comp = c.instances.find(i => {
                return i.graph.id === graph.id;
            });
            if (comp !== undefined) {
                instanceIDXMap.set(comp.id, index);
            }
        });
        if (component !== undefined) {
            const componentNameInGraph = component.id;
            //only take the edges in the graph that have something to do with our component
            graph.edges.filter((edge) => {
                return (edge.from.id === componentNameInGraph || edge.to.id === componentNameInGraph);
            }).forEach((edge, index) => {
                // for every edge in the model we create a transition
                const fromState = states[index];
                const toState = states[index + 1];
                let prob = (edge.from.id === componentNameInGraph) ? 100 : this.getProb(model, componentIDX);
                prob = prob / 100;
                const sourceComponentIDX = instanceIDXMap.get(edge.from.id);
                const targetComponentIDX = instanceIDXMap.get(edge.to.id);
                const newEdge = new StateTransition(index, prob, fromState, toState, graph.id, componentIDX, sourceComponentIDX, targetComponentIDX);
                transitions.push(newEdge);
                fromState.stateTransitionsOut.push(newEdge);
                toState.stateTransitionsIn.push(newEdge);
                // if the edge is an incoming edge we add a transition to the error state
                if (edge.from.id !== componentNameInGraph) {
                    const errorState = states[states.length - 1];
                    const errorEdge = new StateTransition(0 - index, 1 - prob, fromState, errorState, graph.id, componentIDX, sourceComponentIDX, targetComponentIDX);
                    transitions.push(errorEdge);
                    fromState.stateTransitionsOut.push(errorEdge);
                    errorState.stateTransitionsIn.push(errorEdge);
                }
            });
        }
        return transitions;
    }

    private static getProb(model: Model, componentIDX: number): number {
        return model.components[componentIDX].component.getAttribute('reliability').value;
    }
}
