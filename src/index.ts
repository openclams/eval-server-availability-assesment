import express, { response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 8088; // default port to listen

import {CatalogFactory, 
    Component,
    ComponentFactory,
    JsonCatalog,
    Model, 
    ModelFactory, 
    Service} from '@openclams/clams-ml';
import JsonReplacementProtocol from "./json-replacement-protocol";

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());


// define a route handler for the default home page
app.post( "/", async ( req, res ) => {
    // Deserialize the json model
    const model = ModelFactory.fromJSON(req.body.model);
    // Connect the model with service catalog 
    await loadCatalogs(model);
    // Find all leafs of the sub-tree of each component
    const searchSpace = listAllComponentOptions(model);
    // Call algorithm that returns best replacement options
    const replacementList = algorithm(model,searchSpace);
    // Return the result to the caller
    res.json({
        result: "89 % at 300 $/m",
        replacements: replacementList
    } as JsonReplacementProtocol);
} );

// start the express server
app.listen( port, () => {
    // tslint:disable-next-line:no-console
    console.log( `server started at http://localhost:${ port }` );
} );

/**
 * Skeleton for implementing an evaluation algorithm
 * 
 * In the follwoing, we provide some examples how to use models
 * and replace components in the model.
 * 
 * @param searchSpace The list of replacement options 
 */
function algorithm(model: Model, searchSpace:SearchSpace[]){

    // Example replace a component in the model
    // 1. Argument is the index of the component in model.components, here  model.components[0]
    // 2. Argument is the model
    // 3. Argument is the component, here we look at the first option in of the first component recommendation
    
    // replace(0,model,searchSpace[0].options[0]); // (Uncomment this line if you want to use it)
    
    // once we replaced the component in the model, we can evalute the model again
    
    // Example create a copy of a model
    const copyModel = ModelFactory.copy(model);
    // Now model and copyModel are two different objects

    // Example just return the first leaf for each component as recommendation
    const replacementList:any[] = searchSpace.map(component => {
        return {
            componentIdx: component.idx,
            replaceWith: component.options.length > 0 ?  component.options[0] : null
        };
    })
    return replacementList;
}

/**
 * For every component in the model, 
 * we list all options of components we can use to replace this component.
 * This function return an list containing the index of the i-th component in 
 * model.components with an array that has all replacements options. 
 */
function listAllComponentOptions(model: Model){
    const res:SearchSpace[] = [];
    model.components.forEach((cw,idx) => {
        const leafs = getLeafs(cw.component);
        res.push({idx: idx, options: leafs});
    });
    return res;
}

/**
 * Return all leaf nodes of the sub-tree beginning at component.
 * 
 * We use a depth-first search (DFS) to find all leafs nodes.
 * If no leafs are available (because component is alredy a leaf), 
 * then function returns an empty list.
 * 
 */
function getLeafs(component:Component){
    const leafs = [];
    const stack:Component[] = [];
    component.children.forEach(child=>stack.push(child));
    while(stack.length){
        const component = stack.pop();
        if(component instanceof Service){
            leafs.push(component);
        }else{
            component.children.forEach(child => stack.push(child));
        }
    }
    return leafs;
}

/**
 * Bind all catalogs of all cloud providers in the model.
 * 
 * A model does not store the cataloags, since they are to large.
 * However, to use the component.children field, the component needs to
 * look up in the tree strucutre which is part of the catalog.
 * With this function we load the catalogs and connect them to the model,
 * so we can itereate over the catalog and search for child/parent nodes.
 */
async function loadCatalogs(model: Model){
    for(const cloudProvider of model.cloudProviders){
        const catalogUrl = cloudProvider.basePath + cloudProvider.catalogFile;
        const response =  await axios.get<JsonCatalog>(catalogUrl)
        const jsonCatalog: JsonCatalog = response.data;
        const catalog = CatalogFactory.fromJSON(cloudProvider, jsonCatalog);
        model.bindTo(catalog);
    }
}

  /**
   * Replace a component in the model with a new component for all
   * instance across all graphs.
   * 
   * @param idx The index of the i-th component wrapper in the model.components list
   * @param component Replacement component
   */
 function replace(idx: number, model: Model, component: Component) {
    // Get the component wrapper that contains the source component
    const cw = model.components[idx];
    // Remember the name, because we unreference the component
    const name = cw.component.getAttribute('name').value;
    // Create a copy of the target component (since it might be a reference to catalog component)
    const componentCopy = ComponentFactory.copy(component, model);
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
 * type or to indentify them better. Therfore the store the individual name of a component
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
function addNameAttribute(component: Component, name: string) {
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

interface SearchSpace{
    idx: number;
    options: Component[];
}