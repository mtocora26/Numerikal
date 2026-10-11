import { IterativeLinearMethod } from './IterativeLinearMethod';

/**
 * Método de Gauss-Seidel (desplazamientos sucesivos): cada incógnita recién calculada se usa de
 * inmediato en las ecuaciones siguientes de la misma iteración.
 *   xᵢ^(k+1) = ( bᵢ − Σ_{j<i} aᵢⱼ xⱼ^(k+1) − Σ_{j>i} aᵢⱼ xⱼ^(k) ) / aᵢᵢ
 */
export class GaussSeidelMethod extends IterativeLinearMethod {
  public readonly id = 'gauss-seidel';
  public readonly name = 'Método de Gauss-Seidel';
  protected readonly sequential = true;
}
