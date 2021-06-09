export default interface JsonReplacementComponent{
        /**
         * The index referencing the component in the
         * `model.component` list that should be replaced.
         */
        componentIdx: number,

        /**
         * The id of the suggested component
         */
        replaceWith: string
}
