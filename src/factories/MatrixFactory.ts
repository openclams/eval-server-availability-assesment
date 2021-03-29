import {CompositeState} from '../model/Composition/CompositeState';
import {StateType} from '../enums/StateType';
import {abs, det, identity, index, Matrix, subset, subtract, zeros} from 'mathjs';


export class MatrixFactory {


    public static getMatrix(compStates: CompositeState[]) {
        // we delete all error transitions since we do not need those
        compStates.forEach(s => {
            s.transitionsOut = s.transitionsOut.filter(t => !t.isErrorTransition);
        });
        // we put the end state at the last index
        const finalStateIndex = compStates.findIndex(c => c.states[0].type === StateType.Final);
        let tmp = compStates[finalStateIndex];
        compStates[finalStateIndex] = compStates[compStates.length - 1];
        compStates[compStates.length - 1] = tmp;

        // we fill in the rows of the matrix according to our composition
        const m = zeros(compStates.length, compStates.length) as Matrix;
        compStates.forEach((cs, index) => {
            cs.transitionsOut.forEach(t => {
                const indexToComp = compStates.indexOf(t.to);
                m.set([index, indexToComp], t.probability);
            });
        });
        //we need a identity matrix the size of our matrix m
        const identityMatrix = identity(compStates.length, compStates.length) as Matrix;
        const iMinusM = subtract(identityMatrix, m) as Matrix;

        // the denominator our cheung calculation is the determinant of the subtraction of identity matrix and m
        const denominator = det(iMinusM);

        const subIMinusM = subset(iMinusM, index(this.range(0, compStates.length - 1), this.range(1, compStates.length)));
        const nominator = det(subIMinusM);
        const rel = abs(nominator / denominator);
        return rel;

    }

    static range(start: number, end: number) {

        return Array.from({length: (end - start)}, (v, k) => k + start);

    }
}
