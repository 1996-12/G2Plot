import * as _ from '@antv/util';
import { registerPlotType } from '../../base/global';
import { LayerConfig } from '../../base/layer';
import ViewLayer, { ViewConfig } from '../../base/view-layer';
import { getComponent } from '../../components/factory';
import { getGeom } from '../../geoms/factory';
import { ICatAxis, ITimeAxis, IValueAxis, Label } from '../../interface/config';
import { extractScale } from '../../util/scale';
import './component/label/bubble-label';
import * as EventParser from './event';
import Quadrant, { QuadrantConfig } from '../scatter/components/quadrant';
import Trendline, { TrendlineConfig } from '../scatter/components/trendline';

interface BubbleStyle {
  /** 圆边大小 */
  lineWidth?: number;
  /** 圆边透明度 */
  strokeOpacity?: number;
  /** 填充透明度 */
  fillOpacity?: number;
  /** 整体透明度 */
  opacity?: number;
}

const G2_GEOM_MAP = {
  bubble: 'point',
};

const PLOT_GEOM_MAP = {
  point: 'bubble',
};

export interface BubbleViewConfig extends ViewConfig {
  /** 气泡大小 */
  bubbleSize?: [number, number];
  /** 气泡样式 */
  bubbleStyle?: BubbleStyle | ((...args: any) => BubbleStyle);
  /** 气泡大小字段 */
  sizeField?: string;
  /** 气泡颜色字段 */
  colorFields?: string | string[];
  /** x 轴配置 */
  xAxis?: ICatAxis | ITimeAxis | IValueAxis;
  /** y 轴配置 */
  yAxis?: IValueAxis;
  quadrant?: QuadrantConfig;
  trendline?: TrendlineConfig;
}

export interface BubbleLayerConfig extends BubbleViewConfig, LayerConfig {}

export default class BubbleLayer<T extends BubbleLayerConfig = BubbleLayerConfig> extends ViewLayer<T> {
  public static getDefaultOptions(): any {
    return _.deepMix({}, super.getDefaultOptions(), {
      bubbleSize: [8, 58],
      bubbleStyle: {
        opacity: 0.5,
      },
      xAxis: {
        grid: {
          visible: true,
        },
      },
      yAxis: {
        grid: {
          visible: true,
        },
      },
      tooltip: {
        visible: true,
        shared: false,
        crosshairs: {
          type: 'rect',
        },
      },
      label: {
        visible: false,
        position: 'top',
      },
      shape: 'circle',
    });
  }

  public type: string = 'bubble';

  public bubbles: any;
  protected quadrant: Quadrant;
  protected trendline: Trendline;

  public afterRender() {
    super.afterRender();
    if (this.options.quadrant && !this.quadrant) {
      this.quadrant = new Quadrant({
        view: this.view,
        plotOptions: this.options,
        ...this.options.quadrant,
      });
      this.quadrant.render();
    }
    if (this.options.trendline) {
      this.trendline = new Trendline({
        view: this.view,
        plotOptions: this.options,
        ...this.options.trendline,
      });
      this.trendline.render();
    }
  }

  public destroy() {
    if (this.quadrant) {
      this.quadrant.destroy();
      this.quadrant = null;
    }
    if (this.trendline) {
      this.trendline.destroy();
      this.trendline = null;
    }
    super.destroy();
  }

  public getOptions(props: T) {
    const options = super.getOptions(props);

    // 气泡图对外暴露 bubbleSize，geom 需要 pointSize
    return _.deepMix({}, options, {
      pointSize: options.bubbleSize,
      pointStyle: options.bubbleStyle,
    });
  }

  protected geometryParser(dim, type) {
    if (dim === 'g2') {
      return G2_GEOM_MAP[type];
    }
    return PLOT_GEOM_MAP[type];
  }

  protected scale() {
    const props = this.options;
    const scales = {};
    /** 配置x-scale */
    scales[props.xField] = {};
    if (_.has(props, 'xAxis')) {
      extractScale(scales[props.xField], props.xAxis);
    }
    /** 配置y-scale */
    scales[props.yField] = {};
    if (_.has(props, 'yAxis')) {
      extractScale(scales[props.yField], props.yAxis);
    }
    this.setConfig('scales', scales);
    super.scale();
  }

  protected coord() {}

  protected addGeometry() {
    const props = this.options;

    const bubbles = getGeom('point', 'circle', {
      plot: this,
    });

    if (props.label) {
      bubbles.label = this.extractLabel();
    }

    /** 取消气泡大小图例 */
    this.setConfig('legends', {
      fields: {
        [props.sizeField]: false,
      },
    });

    this.bubbles = bubbles;
    this.setConfig('element', bubbles);
  }

  protected annotation() {}

  protected animation() {
    const props = this.options;
    if (props.animation === false) {
      /** 关闭动画 */
      this.bubbles.animate = false;
    }
  }

  protected parseEvents(eventParser) {
    super.parseEvents(EventParser);
  }

  protected extractLabel() {
    const props = this.options;
    const label = props.label as Label;
    if (label && label.visible === false) {
      return false;
    }
    const labelConfig = getComponent('label', {
      plot: this,
      labelType: 'bubbleLabel',
      fields: [props.yField],
      ...label,
    });
    return labelConfig;
  }
}

registerPlotType('bubble', BubbleLayer);
