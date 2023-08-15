import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';

const { utilities: csToolsUtils } = csTools;
const LABELMAP = csTools.Enums.SegmentationRepresentations.Labelmap;

console.log(
  '>>>>> csToolsUtils.dynamicVolume.getDataInTime ::',
  csToolsUtils.dynamicVolume.getDataInTime
);

const dynamicVolume = {
  leftPanel:
    '@ohif/extension-cornerstone-dynamic-volume.panelModule.dynamic-volume',
  rightPanel:
    '@ohif/extension-cornerstone-dynamic-volume.panelModule.ROISegmentation',
};

const defaultPanels = {
  left: [dynamicVolume.leftPanel],
  right: [],
};

const defaultLayout = { panels: defaultPanels };

const workflowSettings = {
  steps: [
    {
      id: 'dataPreparation',
      name: 'Data Preparation',
      layout: {
        panels: {
          left: [dynamicVolume.leftPanel],
        },
      },
      hangingProtocol: {
        protocolId: 'default4D',
        stageId: 'dataPreparation',
      },
    },
    {
      id: 'registration',
      name: 'Registration',
      layout: defaultLayout,
      hangingProtocol: {
        protocolId: 'default4D',
        stageId: 'registration',
      },
    },
    {
      id: 'review',
      name: 'Review',
      layout: defaultLayout,
      hangingProtocol: {
        protocolId: 'default4D',
        stageId: 'review',
      },
    },
    {
      id: 'roiQuantification',
      name: 'ROI Quantification',
      layout: {
        panels: {
          left: [dynamicVolume.leftPanel],
          right: [dynamicVolume.rightPanel],
        },
      },
      hangingProtocol: {
        protocolId: 'default4D',
        stageId: 'roiQuantification',
      },
    },
    {
      id: 'kineticAnalysis',
      name: 'Kinect Analysis',
      layout: defaultLayout,
      hangingProtocol: {
        protocolId: 'default4D',
        stageId: 'kinectAnalysis',
      },

      onBeforeActivate: ({ servicesManager }) => {
        const {
          segmentationService,
          displaySetService,
        } = servicesManager.services;

        const segmentations = segmentationService.getSegmentations();
        console.log(
          '>>>>> onBeforeActivate :: segmentations ::',
          segmentations
        );

        // const volumes = segmentations.map(segmentation =>
        //   cs.cache.getVolume(segmentation.id)
        // );

        (window as any).cs = cs;

        const segmentationData = segmentations.map(segmentation => {
          debugger;

          const { representationData } = segmentation;
          const {
            // volumeId: segVolumeId,
            referencedVolumeId,
          } = representationData[LABELMAP];
          const referencedVolume = cs.cache.getVolume(referencedVolumeId);

          return csToolsUtils.dynamicVolume.getDataInTime(referencedVolume, {
            maskVolumeId: segmentation.id,
          });
        });

        console.log(
          '>>>>> onBeforeActivate :: segmentationData ::',
          segmentationData
        );

        // displaySetService.makeDisplaySets(instances)
      },
      // onAfterActivate: () => console.log('>>>>> onAfterActivate'),
      // onBeforeInactivate: () => console.log('>>>>> onBeforeInactivate'),
      // onAfterInactivate: () => console.log('>>>>> onAfterInactivate'),
    },
  ],
};

export { workflowSettings as default };
