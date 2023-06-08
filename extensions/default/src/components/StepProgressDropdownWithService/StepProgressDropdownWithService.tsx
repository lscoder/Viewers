import React, { useEffect, useState, useCallback, ReactElement } from 'react';
import { ServicesManager } from '@ohif/core';
import { StepProgressDropdown } from '@ohif/ui';

// Long text to test tooptip size limit
const loremIpsum = new Array(7)
  .join(` Lorem ipsum, dolor sit amet consectetur adipisicing elit`)
  .substring(1);

const stagesToDropdownOptions = (stages = []) => {
  return stages.map(stage => ({
    label: stage.name,
    value: stage.id,
    info: `${stage.name.toUpperCase()} information text. ${loremIpsum}`,
  }));
};

function StepProgressDropdownWithService({
  servicesManager,
}: {
  servicesManager: ServicesManager;
}): ReactElement {
  const { workflowStagesService } = servicesManager.services;
  const [stages, setStages] = useState(workflowStagesService.workflowStages);
  const [activeStage, setActiveStage] = useState(
    workflowStagesService.activeWorkflowStage
  );
  const [dropdownOptions, setDropdownOptions] = useState(
    stagesToDropdownOptions(workflowStagesService.workflowStages)
  );

  const setSelectedOptionAsCompleted = useCallback(selectedOption => {
    if (!selectedOption || selectedOption.completed) {
      return;
    }

    setDropdownOptions(prevOptions => {
      const newOptionsState = [...prevOptions];
      const optionIndex = newOptionsState.findIndex(
        option => option.value === selectedOption.value
      );

      newOptionsState[optionIndex] = {
        ...selectedOption,
        completed: true,
      };

      return newOptionsState;
    });
  }, []);

  const handleDropdownChange = useCallback(
    ({ selectedOption }) => {
      if (!selectedOption) {
        return;
      }

      // TODO: Stages should be marked as completed after user has completed some action when required (not implemented)
      setSelectedOptionAsCompleted(selectedOption);

      const stage = stages.find(stage => stage.id === selectedOption.value);
      workflowStagesService.setActiveWorkflowStage(stage.id);
    },
    [stages, workflowStagesService, setSelectedOptionAsCompleted]
  );

  useEffect(() => {
    const { unsubscribe: unsubStagesChanged } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.STAGES_CHANGED,
      () => {
        setStages(workflowStagesService.workflowStages);
        setDropdownOptions(
          stagesToDropdownOptions(workflowStagesService.workflowStages)
        );
      }
    );

    const {
      unsubscribe: unsubActiveStageChanged,
    } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.ACTIVE_STAGE_CHANGED,
      () => setActiveStage(workflowStagesService.activeWorkflowStage)
    );

    return () => {
      unsubStagesChanged();
      unsubActiveStageChanged();
    };
  }, [servicesManager, workflowStagesService, activeStage]);

  return (
    <StepProgressDropdown
      options={dropdownOptions}
      value={activeStage?.id}
      onChange={handleDropdownChange}
    />
  );
}

export default StepProgressDropdownWithService;
