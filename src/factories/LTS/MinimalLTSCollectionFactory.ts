import {CLTSCollection} from '../../model/LTS/CLTSCollection';
import {MinimalLTSCollection} from '../../model/LTS/MinimalLTSCollection';

export class MinimalLTSCollectionFactory {

    public static getMinimalLTSCollectionFactory(cltss: CLTSCollection) {

        const collection = cltss.componentLabelledTransitionSystems.map(c => {
            return c.minimize();
        });
        return new MinimalLTSCollection(collection);
    }
}
