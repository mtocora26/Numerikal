import { IterativeLinearMethod } from './IterativeLinearMethod';

/**
 * Método de Jacobi (desplazamientos simultáneos): las incógnitas nuevas se calculan solo con
 * los valores de la iteración anterior.
 *   xᵢ^(k+1) = ( bᵢ − Σ_{j≠i} aᵢⱼ xⱼ^(k) ) / aᵢᵢ
 */
export class JacobiMethod extends IterativeLinearMethod {
  public readonly id = 'jacobi';
  public readonly name = 'Método de Jacobi';
  protected readonly sequential = false;
}
