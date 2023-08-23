import * as d3 from 'd3';
import { rollup } from 'd3';
// import { scaleLinear } from 'd3-scale';
// import { line } from 'd3-shape';
// import { axisBottom, axisLeft } from 'd3-axis';
import { max } from 'd3-array';

import chart from './chart';
import events from './events';

const {
  external: { resetZoom },
} = events;

/**
 * @typedef TimecoursePoint It defines a tuple of timecourse value (time X intensity)
 * @type {array}
 * @property {number} 0 indicates x|y value on the pair (x,y)
 * @property {number} 1 indicates x|y value on the pair (x,y)
 */

/**
 * @typedef TimecoursePointDef It defines the shape of a given TimecoursePoint Axis
 * @type {object}
 * @property {string} label label for given TimecoursePoint Axis
 * @property {string} [unit] unit for given TimecoursePoint Axis
 * @property {string} type defines the type of given TimecoursePoint Axis
 * @property {number} indexRef refers the index into given TimecoursePoint for the current Axis Definition
 */

/**
 * It gets max value of an array, considering value of param index
 *
 * @param {TimecoursePoint[]} array array of items to be evaluated
 * @param {number} index index of each array`s item to be evaluated
 * @return {any} max value
 */
function _getMaxValue(array, index) {
  return max(array, arrayItem => {
    return arrayItem[index];
  });
}
// margin convention practice
const MARGIN = { top: 20, right: 50, bottom: 50, left: 50 };

/**
 * It creates a svg chart containing lines, dots, axis, labels
 *
 * @param {object} d3SVGRef svg content reference to append chart
 * @param {Object<string, TimecoursePointDef>} axis definition of axis
 * @param {object} points list of points to be created
 * @param {number} width width for whole content including lines, dots, axis, labels
 * @param {number} height height for whole content including lines, dots, axis, labels
 * @param {boolean} showAxisLabels flag to display labels or not
 *
 * @modifies {d3SVGRef}
 */
const addLineChartNode2 = (d3SVGRef, axis, series, width, height) => {
  let points = [];

  const { x: XAxis, y: YAxis } = axis;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 30;

  console.clear();

  series.forEach(curSeries => {
    points = points.concat(
      curSeries.points.map(point => {
        // console.log('>>>>> point[XAxis.indexRef] ::', point[XAxis.indexRef]);
        // console.log('>>>>> point[XAxis.indexRef] ::', x(point[XAxis.indexRef]));
        // console.log('>>>>> point[YAxis.indexRef] ::', point[YAxis.indexRef]);
        // console.log('>>>>> point[YAxis.indexRef] ::', y(point[YAxis.indexRef]));

        return [point[XAxis.indexRef], point[YAxis.indexRef], curSeries.label];
      })
    );
  });

  console.log('>>>>> points ::', [...points]);

  console.log(
    '>>>>> d3.extent(points, p => p[0]) ::',
    d3.extent(points, p => {
      console.log(p);
      return p[0];
    })
  );

  // Create the positional scales.
  const x = d3
    .scaleLinear()
    .domain(d3.extent(points, p => p[0]))
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(points, p => p[1]))
    .range([height - marginBottom, marginTop]);

  points = points.map(p => [x(p[0]), y(p[1]), p[2]]);
  console.log('>>>>> points ::', [...points]);

  const groups = rollup(
    points,
    v => Object.assign(v, { z: v[0][2] }),
    d => d[2]
  );
  console.log('>>>>> groups :: ', groups);

  // Create the SVG container.
  // const svg = d3.create("svg")
  d3SVGRef
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr(
      'style',
      'max-width: 100%; height: auto; overflow: visible; font: 10px sans-serif; background-color: #999'
    );

  // Add the horizontal axis.
  d3SVGRef
    .append('g')
    .attr('transform', `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  // Add the vertical axis.
  d3SVGRef
    .append('g')
    .attr('transform', `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select('.domain').remove())
    .call(g =>
      g
        .append('text')
        .attr('x', -marginLeft)
        .attr('y', 10)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .text('↑ Unemployment (%)')
    );

  // Draw the lines.
  const line = d3.line();
  const path = d3SVGRef
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .selectAll('path')
    .data(groups.values())
    .join('path')
    .style('mix-blend-mode', 'multiply')
    .attr('d', line);

  // Add an invisible layer for the interactive tip.
  const dot = d3SVGRef.append('g').attr('display', 'none');

  dot.append('circle').attr('r', 2.5);

  dot
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('y', -8);

  d3SVGRef
    .on('pointerenter', pointerentered)
    .on('pointermove', pointermoved)
    .on('pointerleave', pointerleft)
    .on('touchstart', event => event.preventDefault());

  return d3SVGRef.node();

  // When the pointer moves, find the closest point, update the interactive tip, and highlight
  // the corresponding line. Note: we don't actually use Voronoi here, since an exhaustive search
  // is fast enough.
  function pointermoved(event) {
    const [xm, ym] = d3.pointer(event);
    const i = d3.leastIndex(points, ([x, y]) => Math.hypot(x - xm, y - ym));
    const [x, y, k] = points[i];
    path
      .style('stroke', ({ z }) => (z === k ? null : '#ddd'))
      .filter(({ z }) => z === k)
      .raise();
    dot.attr('transform', `translate(${x},${y})`);
    dot.select('text').text(k);
    d3SVGRef.property('value', points[i]).dispatch('input', { bubbles: true });
  }

  function pointerentered() {
    path.style('mix-blend-mode', null).style('stroke', '#ddd');
    dot.attr('display', null);
  }

  function pointerleft() {
    path.style('mix-blend-mode', 'multiply').style('stroke', null);
    dot.attr('display', 'none');
    d3SVGRef.node().value = null;
    d3SVGRef.dispatch('input', { bubbles: true });
  }
};

/**
 * It creates a svg chart containing lines, dots, axis, labels
 *
 * @param {object} d3SVGRef svg content reference to append chart
 * @param {Object<string, TimecoursePointDef>} axis definition of axis
 * @param {object} points list of points to be created
 * @param {number} width width for whole content including lines, dots, axis, labels
 * @param {number} height height for whole content including lines, dots, axis, labels
 * @param {boolean} showAxisLabels flag to display labels or not
 *
 * @modifies {d3SVGRef}
 */
const addLineChartNode = (
  d3SVGRef,
  axis,
  series,
  width,
  height,
  showAxisLabels = true,
  showAxisGrid = false,
  transparentChartBackground = false
) => {
  console.clear();

  const _width = width - MARGIN.left - MARGIN.right;
  const _height = height - MARGIN.top - MARGIN.bottom;
  const { x: XAxis, y: YAxis } = axis;
  // const points = series[0].points;
  let points = [];

  function createAxisScale(points, pointsIndex, rangeBottom, rangeUpper) {
    const range = d3.extent(points, p => p[pointsIndex]);

    return d3
      .scaleLinear()
      .domain([range[0], range[1] * 1.05])
      .range([rangeBottom, rangeUpper]);
  }

  series.forEach(curSeries => {
    points = points.concat(
      curSeries.points.map(point => [
        point[XAxis.indexRef],
        point[YAxis.indexRef],
        curSeries.label,
      ])
    );
  });

  // const maxX = _getMaxValue(points, 0);
  // const maxY = _getMaxValue(points, 1);
  // const xAxisScale = createAxisScale(0, maxX, 0, _width);
  // const yAxisScale = createAxisScale(0, maxY, _height, 0);
  const xAxisScale = createAxisScale(points, 0, 0, _width);
  const yAxisScale = createAxisScale(points, 1, _height, 0);

  const parseXPoint = axisScale => (point, index) => {
    return (axisScale || xAxisScale)(points[index][0]);
  };

  const parseYPoint = axisScale => point => {
    return (axisScale || yAxisScale)(point.y);
  };

  // Remove old D3 elements
  chart.removeContents(d3SVGRef);

  const chartWrapper = chart.container.addNode(
    d3SVGRef,
    width,
    height,
    MARGIN.left,
    MARGIN.top
  );

  // add background
  chart.background.addNode(
    chartWrapper,
    _width,
    _height,
    transparentChartBackground
  );

  // call the x axis in a group tag
  const xAxisGenerator = d3.axisBottom(xAxisScale);

  console.log('>>>>> xAxisGenerator ::', xAxisGenerator);

  if (showAxisGrid) {
    xAxisGenerator.tickSize(-_height).tickPadding(10);
  }
  const gXAxis = chart.axis.addNode(
    chartWrapper,
    XAxis,
    undefined,
    _height,
    undefined,
    () => xAxisGenerator,
    showAxisLabels,
    _width / 2,
    _height + MARGIN.bottom / 2 + 10,
    undefined,
    showAxisGrid
  );
  const yAxisGenerator = d3.axisLeft(yAxisScale);

  if (showAxisGrid) {
    yAxisGenerator.tickSize(-_width).tickPadding(10);
  }
  // add y axis
  const gYAxis = chart.axis.addNode(
    chartWrapper,
    YAxis,
    undefined,
    undefined,
    undefined,
    () => yAxisGenerator,
    showAxisLabels,
    0 - _height / 2,
    0 - MARGIN.left,
    [
      { key: 'transform', value: 'rotate(-90)' },
      { key: 'dy', value: '1em' },
    ],
    showAxisGrid
  );

  // create line
  // const line = d3
  //   .line()
  //   .x(parseXPoint(xAxisScale))
  //   .y(parseYPoint(yAxisScale));

  // const dataset = points.map(point => {
  //   return { y: point[1] };
  // });

  // add line chart
  // chart.lines.addNode(chartWrapper, dataset, line);

  const points2 = points.slice();
  // const points2 = points.map(p => [xAxisScale(p[0]), yAxisScale(p[1]), p[2]]);

  const groups = rollup(
    points2,
    v => Object.assign(v, { z: v[0][2] }),
    d => d[2]
  );

  console.log('>>>>> groups ::', groups);

  const datasets = [];

  Array.from(groups.values()).forEach((group, seriesIndex) => {
    const line = d3
      .line()
      .x(parseXPoint(xAxisScale))
      .y(parseYPoint(yAxisScale));

    const dataset = group.map(point => {
      return { y: point[1] };
    });

    const seriesContainer = chartWrapper
      .append('g')
      .attr('id', `series_${seriesIndex}`);

    chart.lines.addNode(seriesContainer, dataset, line);

    // add chart points
    chart.points.addNode(
      seriesContainer,
      dataset,
      parseXPoint(xAxisScale),
      parseYPoint(yAxisScale)
    );

    // datasets = datasets.concat(dataset);
    datasets.push(dataset);
  });

  // const line = d3.line();
  // .x(parseXPoint(xAxisScale))
  // .y(parseYPoint(yAxisScale));

  // const path = chartWrapper
  //   .append('g')
  //   .attr('fill', 'none')
  //   .attr('stroke', 'red')
  //   .attr('stroke-width', 1.5)
  //   .attr('stroke-linejoin', 'round')
  //   .attr('stroke-linecap', 'round')
  //   .selectAll('path')
  //   .data(groups.values())
  //   .join('path')
  //   // .style('mix-blend-mode', 'multiply')
  //   .attr('d', line);

  // return chartWrapper;

  // bind events
  events.bindMouseEvents(
    chartWrapper,
    gXAxis,
    gYAxis,
    xAxisScale,
    yAxisScale,
    xAxisGenerator,
    yAxisGenerator,
    parseXPoint,
    parseYPoint,
    datasets
  );

  return chartWrapper;
};

export { addLineChartNode, resetZoom };
