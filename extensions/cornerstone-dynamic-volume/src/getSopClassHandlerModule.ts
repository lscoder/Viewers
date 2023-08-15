import { isImage } from '@ohif/core/src/utils/isImage';
import sopClassDictionary from '@ohif/core/src/utils/sopClassDictionary';
import ImageSet from '@ohif/core/src/classes/ImageSet';
import isDisplaySetReconstructable from '@ohif/core/src/utils/isDisplaySetReconstructable';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';

import { utils } from '@ohif/core';

import { SOPClassHandlerName, SOPClassHandlerId } from './id';

const DEFAULT_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';
const DYNAMIC_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingDynamicImageVolume';

const sopClassUids = [
  '1.2.3.4.5.6.7',
  // sopClassDictionary.ComputedRadiographyImageStorage,
  // sopClassDictionary.DigitalXRayImageStorageForPresentation,
  // sopClassDictionary.DigitalXRayImageStorageForProcessing,
  // sopClassDictionary.DigitalMammographyXRayImageStorageForPresentation,
  // sopClassDictionary.DigitalMammographyXRayImageStorageForProcessing,
  // sopClassDictionary.DigitalIntraOralXRayImageStorageForPresentation,
  // sopClassDictionary.DigitalIntraOralXRayImageStorageForProcessing,
  // sopClassDictionary.CTImageStorage,
  // sopClassDictionary.EnhancedCTImageStorage,
  // sopClassDictionary.LegacyConvertedEnhancedCTImageStorage,
  // sopClassDictionary.UltrasoundMultiframeImageStorage,
  // sopClassDictionary.MRImageStorage,
  // sopClassDictionary.EnhancedMRImageStorage,
  // sopClassDictionary.EnhancedMRColorImageStorage,
  // sopClassDictionary.LegacyConvertedEnhancedMRImageStorage,
  // sopClassDictionary.UltrasoundImageStorage,
  // sopClassDictionary.UltrasoundImageStorageRET,
  // sopClassDictionary.SecondaryCaptureImageStorage,
  // sopClassDictionary.MultiframeSingleBitSecondaryCaptureImageStorage,
  // sopClassDictionary.MultiframeGrayscaleByteSecondaryCaptureImageStorage,
  // sopClassDictionary.MultiframeGrayscaleWordSecondaryCaptureImageStorage,
  // sopClassDictionary.MultiframeTrueColorSecondaryCaptureImageStorage,
  // sopClassDictionary.XRayAngiographicImageStorage,
  // sopClassDictionary.EnhancedXAImageStorage,
  // sopClassDictionary.XRayRadiofluoroscopicImageStorage,
  // sopClassDictionary.EnhancedXRFImageStorage,
  // sopClassDictionary.XRay3DAngiographicImageStorage,
  // sopClassDictionary.XRay3DCraniofacialImageStorage,
  // sopClassDictionary.BreastTomosynthesisImageStorage,
  // sopClassDictionary.BreastProjectionXRayImageStorageForPresentation,
  // sopClassDictionary.BreastProjectionXRayImageStorageForProcessing,
  // sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForPresentation,
  // sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForProcessing,
  // sopClassDictionary.NuclearMedicineImageStorage,
  // sopClassDictionary.VLEndoscopicImageStorage,
  // sopClassDictionary.VideoEndoscopicImageStorage,
  // sopClassDictionary.VLMicroscopicImageStorage,
  // sopClassDictionary.VideoMicroscopicImageStorage,
  // sopClassDictionary.VLSlideCoordinatesMicroscopicImageStorage,
  // sopClassDictionary.VLPhotographicImageStorage,
  // sopClassDictionary.VideoPhotographicImageStorage,
  // sopClassDictionary.OphthalmicPhotography8BitImageStorage,
  // sopClassDictionary.OphthalmicPhotography16BitImageStorage,
  // sopClassDictionary.OphthalmicTomographyImageStorage,
  // sopClassDictionary.VLWholeSlideMicroscopyImageStorage,
  // sopClassDictionary.PositronEmissionTomographyImageStorage,
  // sopClassDictionary.EnhancedPETImageStorage,
  // sopClassDictionary.LegacyConvertedEnhancedPETImageStorage,
  // sopClassDictionary.RTImageStorage,
  // sopClassDictionary.EnhancedUSVolumeStorage,
];

const getDynamicVolumeInfo = (appContext, instances) => {
  const { extensionManager } = appContext;

  if (!extensionManager) {
    throw new Error('extensionManager is not available');
  }

  const imageIds = instances.map(({ imageId }) => imageId);
  const volumeLoaderUtility = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.volumeLoader'
  );
  const {
    getDynamicVolumeInfo: csGetDynamicVolumeInfo,
  } = volumeLoaderUtility.exports;

  return csGetDynamicVolumeInfo(imageIds);
};

const isMultiFrame = instance => {
  return instance.NumberOfFrames > 1;
};

function getDisplaySetInfo(appContext, instances) {
  const dynamicVolumeInfo = getDynamicVolumeInfo(appContext, instances);
  const { isDynamicVolume, timePoints } = dynamicVolumeInfo;
  let displaySetInfo;

  if (isDynamicVolume) {
    const timePoint = timePoints[0];
    const instancesMap = new Map();

    // O(n) to convert it into a map and O(1) to find each instance
    instances.forEach(instance => instancesMap.set(instance.imageId, instance));

    const firstTimePointInstances = timePoint.map(imageId =>
      instancesMap.get(imageId)
    );

    displaySetInfo = isDisplaySetReconstructable(firstTimePointInstances);
  } else {
    displaySetInfo = isDisplaySetReconstructable(instances);
  }

  return {
    isDynamicVolume,
    ...displaySetInfo,
  };
}

const makeDisplaySet = (appContext, instances) => {
  const instance = instances[0];
  const imageSet = new ImageSet(instances);

  const {
    isDynamicVolume,
    value: isReconstructable,
    averageSpacingBetweenFrames,
  } = getDisplaySetInfo(appContext, instances);

  const volumeLoaderSchema = isDynamicVolume
    ? DYNAMIC_VOLUME_LOADER_SCHEME
    : DEFAULT_VOLUME_LOADER_SCHEME;

  // set appropriate attributes to image set...
  imageSet.setAttributes({
    volumeLoaderSchema,
    displaySetInstanceUID: imageSet.uid, // create a local alias for the imageSet UID
    SeriesDate: instance.SeriesDate,
    SeriesTime: instance.SeriesTime,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
    SeriesNumber: instance.SeriesNumber || 0,
    FrameRate: instance.FrameTime,
    SOPClassUID: instance.SOPClassUID,
    SeriesDescription: instance.SeriesDescription || '',
    Modality: instance.Modality,
    isMultiFrame: isMultiFrame(instance),
    countIcon: isReconstructable ? 'icon-mpr' : undefined,
    numImageFrames: instances.length,
    SOPClassHandlerId,
    isReconstructable,
    averageSpacingBetweenFrames: averageSpacingBetweenFrames || null,
  });

  // Sort the images in this series if needed
  const shallSort = true; //!OHIF.utils.ObjectPath.get(Meteor, 'settings.public.ui.sortSeriesByIncomingOrder');
  if (shallSort) {
    imageSet.sortBy((a, b) => {
      // Sort by InstanceNumber (0020,0013)
      return (
        (parseInt(a.InstanceNumber) || 0) - (parseInt(b.InstanceNumber) || 0)
      );
    });
  }

  // Include the first image instance number (after sorted)
  /*imageSet.setAttribute(
    'instanceNumber',
    imageSet.getImage(0).InstanceNumber
  );*/

  /*const isReconstructable = isDisplaySetReconstructable(series, instances);

  imageSet.isReconstructable = isReconstructable.value;

  if (isReconstructable.missingFrames) {
    // TODO -> This is currently unused, but may be used for reconstructing
    // Volumes with gaps later on.
    imageSet.missingFrames = isReconstructable.missingFrames;
  }*/

  return imageSet;
};

const isSingleImageModality = modality => {
  return modality === 'CR' || modality === 'MG' || modality === 'DX';
};

function getSopClassUids(instances) {
  const uniqueSopClassUidsInSeries = new Set();
  instances.forEach(instance => {
    uniqueSopClassUidsInSeries.add(instance.SOPClassUID);
  });
  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}

/**
 * Basic SOPClassHandler:
 * - For all Image types that are stackable, create
 *   a displaySet with a stack of images
 *
 * @param {SeriesMetadata} series The series metadata object from which the display sets will be created
 * @returns {Array} The list of display sets created for the given series object
 */
function _getDisplaySetsFromSeries(appContext, instances) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const displaySets = [];
  const sopClassUids = getSopClassUids(instances);

  // Search through the instances (InstanceMetadata object) of this series
  // Split Multi-frame instances and Single-image modalities
  // into their own specific display sets. Place the rest of each
  // series into another display set.
  const stackableInstances = [];
  instances.forEach(instance => {
    // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
    if (!isImage(instance.SOPClassUID) && !instance.Rows) {
      return;
    }

    let displaySet;

    if (isMultiFrame(instance)) {
      displaySet = makeDisplaySet(appContext, [instance]);

      displaySet.setAttributes({
        sopClassUids,
        isClip: true,
        numImageFrames: instance.NumberOfFrames,
        instanceNumber: instance.InstanceNumber,
        acquisitionDatetime: instance.AcquisitionDateTime,
      });
      displaySets.push(displaySet);
    } else if (isSingleImageModality(instance.Modality)) {
      displaySet = makeDisplaySet(appContext, [instance]);
      displaySet.setAttributes({
        sopClassUids,
        instanceNumber: instance.InstanceNumber,
        acquisitionDatetime: instance.AcquisitionDateTime,
      });
      displaySets.push(displaySet);
    } else {
      stackableInstances.push(instance);
    }
  });

  if (stackableInstances.length) {
    const displaySet = makeDisplaySet(appContext, stackableInstances);
    displaySet.setAttribute('studyInstanceUid', instances[0].StudyInstanceUID);
    displaySet.setAttributes({
      sopClassUids,
    });
    displaySets.push(displaySet);
  }

  return displaySets;
}

function getSopClassHandlerModule(appContext) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(appContext, instances);
  };

  return [
    {
      name: SOPClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}

export { getSopClassHandlerModule as default };
