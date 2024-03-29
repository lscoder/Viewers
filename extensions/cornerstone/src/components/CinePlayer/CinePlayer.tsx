import React, { useCallback, useEffect, useState, useRef } from 'react';
import { CinePlayer, useCine } from '@ohif/ui';
import { Enums, eventTarget, cache } from '@cornerstonejs/core';
import { Enums as StreamingEnums } from '@cornerstonejs/streaming-image-volume-loader';
import { useAppConfig } from '@state';

function WrappedCinePlayer({ enabledVPElement, viewportId, servicesManager }) {
  const { customizationService, displaySetService, viewportGridService } = servicesManager.services;
  const [{ isCineEnabled, cines }, cineService] = useCine();
  const [newStackFrameRate, setNewStackFrameRate] = useState(24);
  const [isDynamic, setIsDynamic] = useState(false);
  const [appConfig] = useAppConfig();
  const isMountedRef = useRef(null);

  const cineHandler = () => {
    if (!cines?.[viewportId] || !enabledVPElement) {
      return;
    }

    const { isPlaying = false, frameRate = 24 } = cines[viewportId];
    const validFrameRate = Math.max(frameRate, 1);

    return isPlaying
      ? cineService.playClip(enabledVPElement, { framesPerSecond: validFrameRate })
      : cineService.stopClip(enabledVPElement);
  };

  const newDisplaySetHandler = useCallback(() => {
    const { viewports } = viewportGridService.getState();
    const { displaySetInstanceUIDs } = viewports.get(viewportId);
    let frameRate = 24;
    let isPlaying = cines[viewportId]?.isPlaying || false;
    displaySetInstanceUIDs.forEach(displaySetInstanceUID => {
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

      if (displaySet.FrameRate) {
        // displaySet.FrameRate corresponds to DICOM tag (0018,1063) which is defined as the the frame time in milliseconds
        // So a bit of math to get the actual frame rate.
        frameRate = Math.round(1000 / displaySet.FrameRate);
        isPlaying ||= !!appConfig.autoPlayCine;
      }
      setIsDynamic(displaySet.isDynamicVolume);
    });

    if (isPlaying) {
      cineService.setIsCineEnabled(isPlaying);
    }
    cineService.setCine({ id: viewportId, isPlaying, frameRate });
    setNewStackFrameRate(frameRate);
  }, [displaySetService, viewportId, viewportGridService, cines]);

  useEffect(() => {
    newDisplaySetHandler();
  }, [isCineEnabled, newDisplaySetHandler]);

  /**
   * Use effect for handling new display set
   */
  useEffect(() => {
    if (!enabledVPElement) {
      return;
    }

    eventTarget.addEventListener(Enums.Events.STACK_VIEWPORT_NEW_STACK, newDisplaySetHandler);
    // this doesn't makes sense that we are listening to this event on viewport element
    enabledVPElement.addEventListener(
      Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
      newDisplaySetHandler
    );

    return () => {
      cineService.setCine({ id: viewportId, isPlaying: false });

      eventTarget.removeEventListener(Enums.Events.STACK_VIEWPORT_NEW_STACK, newDisplaySetHandler);
      enabledVPElement.removeEventListener(
        Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
        newDisplaySetHandler
      );
    };
  }, [enabledVPElement, newDisplaySetHandler, viewportId]);

  useEffect(() => {
    if (!cines || !cines[viewportId] || !enabledVPElement || !isMountedRef.current) {
      return;
    }

    cineHandler();

    return () => {
      cineService.stopClip(enabledVPElement);
    };
  }, [cines, viewportId, cineService, enabledVPElement, cineHandler]);

  if (!isCineEnabled) {
    return null;
  }

  const cine = cines[viewportId];
  const isPlaying = cine?.isPlaying || false;

  return (
    <RenderCinePlayer
      viewportId={viewportId}
      cineService={cineService}
      newStackFrameRate={newStackFrameRate}
      isPlaying={isPlaying}
      isDynamic={isDynamic}
      customizationService={customizationService}
    />
  );
}

function RenderCinePlayer({
  viewportId,
  cineService,
  newStackFrameRate,
  isPlaying,
  isDynamic,
  customizationService,
}) {
  const { component: CinePlayerComponent = CinePlayer } =
    customizationService.get('cinePlayer') ?? {};

  const [dynamicInfo, setDynamicInfo] = useState(null);

  /**
   * Use effect for handling 4D time index changed
   */
  useEffect(() => {
    if (!isDynamic) {
      return;
    }

    const handleTimePointIndexChange = evt => {
      const { volumeId, timePointIndex, numTimePoints, splittingTag } = evt.detail;
      setDynamicInfo({ volumeId, timePointIndex, numTimePoints, label: splittingTag });
    };

    eventTarget.addEventListener(
      StreamingEnums.Events.DYNAMIC_VOLUME_TIME_POINT_INDEX_CHANGED,
      handleTimePointIndexChange
    );

    return () => {
      eventTarget.removeEventListener(
        StreamingEnums.Events.DYNAMIC_VOLUME_TIME_POINT_INDEX_CHANGED,
        handleTimePointIndexChange
      );
    };
  }, [isDynamic]);

  const updateDynamicInfo = useCallback(props => {
    const { volumeId, timePointIndex } = props;
    const volume = cache.getVolume(volumeId);
    volume.timePointIndex = timePointIndex;
  }, []);

  return (
    <CinePlayerComponent
      className="absolute left-1/2 bottom-3 -translate-x-1/2"
      frameRate={newStackFrameRate}
      isPlaying={isPlaying}
      onClose={() => {
        // also stop the clip
        cineService.setCine({
          id: viewportId,
          isPlaying: false,
        });
        cineService.setIsCineEnabled(false);
      }}
      onPlayPauseChange={isPlaying =>
        cineService.setCine({
          id: viewportId,
          isPlaying,
        })
      }
      onFrameRateChange={frameRate =>
        cineService.setCine({
          id: viewportId,
          frameRate,
        })
      }
      isDynamic={isDynamic}
      dynamicInfo={dynamicInfo}
      updateDynamicInfo={updateDynamicInfo}
    />
  );
}

export default WrappedCinePlayer;
