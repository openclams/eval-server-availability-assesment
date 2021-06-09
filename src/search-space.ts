import { Component } from '@openclams/clams-ml';

/**
 * This data strucutre maps a component to
 * its possible refinements.
 */
export default interface SearchSpace{
    /**
     * The index/position of the component in the 
     * model.components list.
     * 
     * This is a helping filed to replace components in
     * the model
     */
    index:number;

    /**
     * Reference to the cloud component from the model
     */
    component: Component;

    /**
     * List of possible refinements that can replace the component
     */
    refinements: Component[];
}