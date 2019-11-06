import * as _ from '@antv/util';
import BasePlot, { PlotCfg } from '../../base/plot';
import LineLayer, { LineLayerConfig } from './layer';

export interface LineConfig extends LineLayerConfig, PlotCfg {}

export default class Line<T extends LineConfig = LineConfig> extends BasePlot<T> {
  public static getDefaultProps = LineLayer.getDefaultOptions;

  public createLayers(props) {
    const layerProps = _.deepMix({}, props);
    layerProps.type = 'line';
    super.createLayers(layerProps);
  }
}
