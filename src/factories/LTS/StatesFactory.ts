import {Graph, Model} from '@openclams/clams-ml';
import {State} from '../../model/LTS/State';
import {StateType} from '../../enums/StateType';

export class StatesFactory {
    //TODO no need for model if we give componentNameInGraph and edges as parameters
    static getStates(model: Model, componentIDX: number, graph: Graph): Array<State> {
        // get specific name of component in our graph
        const states = new Array<State>();
        states.push(new State(0, StateType.Initial, componentIDX, graph.id));
        const component = model.components[componentIDX].instances.find(instance => {
                return instance.graph.id === graph.id;
            }
        );
        if (component !== undefined) {
            const componentNameInGraph = component.id;
            const length = graph.edges.filter((edge) => {
                return (edge.from.id === componentNameInGraph || edge.to.id === componentNameInGraph);
            }).length;
            // create a state for each edge
            // the last edge has type End all other have Normal
            for (let i = 1; i <= length; i++) {
                states.push(new State(i, (i === length) ? StateType.End : StateType.Normal, componentIDX, graph.id));
            }

            // if the component has incoming edges there must be a error state
            if (graph.edges.find(edge => {
                return edge.to.id === componentNameInGraph;
            }) !== undefined) {
                states.push(new State(-1, StateType.Error, componentIDX, graph.id));
            }
        }
        return states;
    }
}
