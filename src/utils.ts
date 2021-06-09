import { Attribute, CatalogComponentFactory, Component, ComponentFactory, JsonCatalogComponent, Model } from "@openclams/clams-ml";
import axios from "axios";
import SearchSpace from "./search-space";

/**
 * Check if two number arrays have equal content.
 * @param a Source array
 * @param b Destination array
 * @returns True if equal, otherwise false
 */
export function arraysEqual(a:number[], b:number[]):boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
  
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }


/**
 * For every component in the model,
 * we list the posssible refinmentes by calling the leaf API endpoint from
 * the componen registry server
 */
 export async function listAllComponentOptions(model: Model):Promise<SearchSpace[]> {

    const results:SearchSpace[] = [];

    let index:number = 0;

    for(const cw of model.components){

        const component = cw.component;

        if(!('components' in component)){

            const refinements = await getLeafs(component);

            results.push({index, component, refinements});
        }
        index++;
    }

    return new Promise<SearchSpace[]>(resolve => {

        resolve(results);

    });
}



const leavsCache:Record<string,Component[]> = {};
/**
 * Return all leaf nodes of the sub-tree beginning at component.
 *
 * We use a depth-first search (DFS) to find all leafs nodes.
 * If no leafs are available (because component is alredy a leaf),
 * then function returns an empty list.
 *
 */
export async function getLeafs(component:Component):Promise<Component[]>{

    if( component.id in leavsCache){

        console.log("Found in cache for [",component.id,"]"
                    ,component.name,
                    " -> num leaves:", leavsCache[component.id].length);
        
        return new Promise<Component[]>(resolve => {

            resolve(leavsCache[component.id]);

        });
    }

    const url = component.cloudProvider.componentUrl+ '/' + component.id + '/leafs';

    const response =  await axios.get<JsonCatalogComponent[]>(url);

    const jsonCatalogComponents = response.data;

    const components = jsonCatalogComponents.map<Component>((jsonCatalogComponent: JsonCatalogComponent) => {

        return CatalogComponentFactory.fromJSON(component.cloudProvider,jsonCatalogComponent);

    }).filter((c: any) => c);

    console.log("Not Found in cache for [",component.id,"]"
    ,component.name,
    " -> num leaves:", components.length);

    leavsCache[component.id] = components;

    return new Promise<Component[]>(resolve => {

            resolve(components);

    });
}




  /**
   * Replace a component in the model with a new component for all
   * instance across all graphs.
   *
   * @param idx The index of the i-th component model.components list
   * @param dstComponent Replacement component
   */
 export function replace( idx:number, dstComponent: Component, model: Model) {
    // Get the component wrapper that contains the source component
    const cw = model.components[idx];
    // Remember the name, because we unreference the component
    const name = cw.component.getAttribute('name').value;
    // Create a copy of the target component
    const componentCopy = dstComponent;//ComponentFactory.copy(dstComponent, model);
    // Assign the component to the component wrapper.
    // Now all instances in cw.instances reference the target component
    cw.component = componentCopy;
    // Finally, add the missing name.
    addNameAttribute(componentCopy, name);
  }

/**
 * Add an attribute containing the name of the component.
 *
 * The name attribute is different to the name field of the component.
 * We do not change the name field, since it is the actual name of the
 * service/patter/template. However, we wish to give components that are connected
 * with instances also an individual name to distinigues multiple components of the same
 * type. Therfore we store the individual name of a component
 * as an attribute called 'name'.
 *
 * Example:
 *
 * >  component.getAttribute('name').value // Contains the individual name,e.g., User Database
 * >  component.name // Contains the service name, e.g., MySql
 *
 *
 * @param component The target component
 * @param name The name of the component as attribute
 */
export function addNameAttribute(component: Component, name: string) {
    const nameAttribute = component.getAttribute('name');
    // If the attribute does not exist, we creat a new one.
    if (!nameAttribute) {
      component.setAttribute({
        id : 'name',
        img: null,
        name: 'Name',
        type: 'string',
        value: name,
        readable: false,
        description: 'Component Name'
      });
    }else{
      nameAttribute.value = name;
    }
}

 /**
  * Add a new cost attribute if it does not exist yet.
  * Assign default cost for new attribute, or when the value is not set.
  */
 export function getCostAttribute(component: Component):Attribute {
    const costAttribute = component.getAttribute('cost');
    if (!costAttribute) {
      component.setAttribute({
        id: 'cost',
        name: 'Cost',
        type: 'cost',
        value: null,
        readable: false,
        img: null,
        description: 'Service cost'
      });
    }
    return costAttribute;
  }
