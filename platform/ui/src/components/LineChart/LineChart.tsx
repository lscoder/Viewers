import React, {
  useEffect,
  useLayoutEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
  ReactElement,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { lineChart } from './d3LineChart';
import * as d3 from 'd3';
import './LineChart.css';

const LineChart = ({
  width: widthProp,
  height: heightProp,
  axis,
  points,
  showAxisLabels,
  showAxisGrid,
  transparentChartBackground,
  containerClassName,
  chartContainerClassName,
}: {
  title: string;
  width: number;
  height: number;
  showAxisGrid: boolean;
  showAxisLabels: boolean;
  transparentChartBackground: boolean;
  containerClassName: string;
  chartContainerClassName: string;
}): ReactElement => {
  const chartContainerRef = useRef(null);
  const [d3SVGContainer, setD3SVGRef] = useState(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const chartContainer = chartContainerRef.current;
    const containerWidth = chartContainer.offsetWidth;
    const containerHeight = chartContainer.offsetHeight;
    const d3Container = d3
      .create('svg')
      .attr('viewBox', [0, 0, containerWidth, containerHeight])
      .style('max-width', `${containerWidth}px`)
      .style('overflow', 'visible');

    chartContainer.append(d3Container.node());

    setD3SVGRef(d3Container);
    setWidth(containerWidth);
    setHeight(containerHeight);
  }, [chartContainerRef]);

  useEffect(() => {
    if (!d3SVGContainer) {
      return;
    }

    const peekIndex = -1;
    const glomerularIndex = -1;

    lineChart.addLineChartNode(
      d3SVGContainer,
      () => console.log('>>>>> movingPointsCallback'),
      axis,
      points,
      peekIndex,
      glomerularIndex,
      width,
      height,
      showAxisLabels,
      showAxisGrid,
      transparentChartBackground
    );
  }, [
    d3SVGContainer,
    axis,
    points,
    width,
    height,
    showAxisLabels,
    showAxisGrid,
    transparentChartBackground,
  ]);

  return (
    <div
      className={classnames(
        'LineChart',
        'text-white',
        {
          [`w-[${widthProp}px]`]: !!widthProp,
          [`h-[${heightProp}px]`]: !!heightProp,
        },
        {
          'w-full': !widthProp,
          'h-full': !heightProp,
        },
        containerClassName
      )}
    >
      <div
        id="__chartContainer"
        ref={chartContainerRef}
        className={classnames('w-full h-full', chartContainerClassName)}
      ></div>
    </div>
  );
};

LineChart.defaultProps = {
  showAxisLabels: true,
  showAxisGrid: true,
  transparentChartBackground: false,
};

LineChart.propTypes = {
  title: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  // axis: PropTypes.shape({})
  // points: PropTypes.
  showAxisLabels: PropTypes.bool,
  showAxisGrid: PropTypes.bool,
  transparentChartBackground: PropTypes.bool,
  containerClassName: PropTypes.string,
  chartContainerClassName: PropTypes.string,
};

export default LineChart;
