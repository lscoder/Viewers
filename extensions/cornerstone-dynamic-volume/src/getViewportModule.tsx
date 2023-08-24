import React from 'react';
import { ServicesManager, CommandsManager, ExtensionManager } from '@ohif/core';
import { LineChart } from '@ohif/ui';

const getViewportModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}: {
  servicesManager: ServicesManager;
  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;
}) => {
  // const ExtendedOHIFCornerstoneViewport = props => {
  //   // const onNewImageHandler = jumpData => {
  //   //   commandsManager.runCommand('jumpToImage', jumpData);
  //   // };
  //   const { toolbarService } = (servicesManager as ServicesManager).services;

  //   return (
  //     <OHIFCornerstoneViewport
  //       {...props}
  //       toolbarService={toolbarService}
  //       servicesManager={servicesManager}
  //       commandsManager={commandsManager}
  //     />
  //   );
  // };

  const LineChartViewport = ({ displaySets }) => {
    const displaySet = displaySets[0];
    const { axis: chartAxis, series: chartSeries } = displaySet.chartData;

    const testPoints = [
      [0, 607.54],
      [1, 648.28],
      [2, 696.7],
      [3, 693.87],
      [4, 740.02],
      [5, 707.04],
      [6, 748.73],
      [7, 792.34],
      [8, 842.03],
      [9, 808.63],
      [10, 798.81],
      [11, 836.71],
      [12, 800.22],
      [13, 761.66],
      [14, 745.5],
      [15, 774.53],
      [16, 824.04],
      [17, 837.02],
      [18, 857.5],
      [19, 818.29],
      [20, 786.71],
      [21, 797.34],
      [22, 795.29],
      [23, 771.26],
      [24, 751.51],
      [25, 800.11],
      [26, 824.1],
      [27, 851.25],
      [28, 826.65],
      [29, 845.48],
      [30, 891.25],
      [31, 899.52],
      [32, 944.36],
      [33, 947.73],
      [34, 923.11],
      [35, 889.22],
      [36, 871.86],
      [37, 871.42],
      [38, 826.14],
      [39, 866.41],
      [40, 897.81],
      [41, 858.01],
      [42, 848.76],
      [43, 818.07],
      [44, 778.81],
      [45, 737.75],
      [46, 719.47],
      [47, 730.18],
      [48, 705.91],
      [49, 689.15],
    ];

    return (
      <LineChart
        // width={600}
        // height={400}
        showLegend={true}
        legendWidth={150}
        axis={{
          x: {
            label: chartAxis.x.label,
            indexRef: 0,
            type: 'x',
          },
          y: {
            label: chartAxis.y.label,
            indexRef: 1,
            type: 'y',
          },
        }}
        series={chartSeries}
        // points={chartSeries[0]}
      />
    );
  };

  return [
    {
      name: 'chartViewport',
      component: LineChartViewport,
    },
  ];
};

export { getViewportModule as default };
