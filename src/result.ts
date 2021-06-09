import { Component } from "@openclams/clams-ml";

export interface Replacement{

    index: number;

    component: Component;
    
    suggestion: Component;

}

export interface Value{

    availability: number;

    cost: number;

    loss: number;

    time: number;

}

export interface Result{

    values:Value;
        
    replacements:Replacement[];

} 