import {CLTSCollection} from '../../model/LTS/CLTSCollection';
import {MinimalLTSCollection} from '../../model/LTS/MinimalLTSCollection';
import {Minimizer} from '../Minimizer';

export class MinimalLTSCollectionFactory {

    public static getMinimalLTSCollectionFactory(cltss: CLTSCollection) {
        const minimizer = new Minimizer();

        const collection = cltss.componentLabelledTransitionSystems.map(c => {
            return Minimizer.minimize(c);
        });
        return new MinimalLTSCollection(collection);
    }
}
