import React, { useEffect, useState, useCallback } from 'react';
import { StepProgressDropdown } from '@ohif/ui';

const loremIpsum = (new Array(7)).join(` Lorem ipsum, dolor sit amet consectetur adipisicing elit`).substring(1);

const stagesToDropdownOptions = (stages = []) => {
  return stages.map(stage => (
    {
      label: stage.name,
      value: stage.id,
      info: `${stage.name.toUpperCase()} information text. ${loremIpsum}`,
    }
  ));
};

function StepProgressDropdownWithService({ servicesManager }) {
  const { workflowStagesService } = servicesManager.services;
  const [stages, setStages] = useState(workflowStagesService.stages);
  const [activeStage, setActiveStage] = useState(workflowStagesService.activeStage);
  const [dropdownOptions, setDropdownOptions] = useState(stagesToDropdownOptions(workflowStagesService.stages));

  const setSelectedOptionAsCompleted = useCallback((selectedOption) => {
    if (!selectedOption || selectedOption.completed) {
      return;
    }

    setDropdownOptions(prevOptions => {
      const newOptionsState = [...prevOptions];
      const optionIndex = newOptionsState.findIndex(option => option.value === selectedOption.value);

      newOptionsState[optionIndex] = {
        ...selectedOption,
        completed: true,
      };

      return newOptionsState;
    });
  }, [])

  const handleDropdownChange = useCallback(({ selectedOption }) => {
    if (!selectedOption) {
      return;
    }

    // TODO: Stages should be marked as completed after user has completed some action when required (not implemented)
    setSelectedOptionAsCompleted(selectedOption);

    const stage = stages.find(stage => stage.id === selectedOption.value);
    workflowStagesService.setActiveStage(stage.id);
  }, [stages, dropdownOptions, workflowStagesService]);


  useEffect(() => {
    const { unsubscribe: unsubStagesChanged } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.STAGES_CHANGED,
      () => {
        setStages(workflowStagesService.stages)
        setDropdownOptions(stagesToDropdownOptions(workflowStagesService.stages));
      }
    );

    const { unsubscribe: unsubActiveStageChanged } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.ACTIVE_STAGE_CHANGED,
      () => setActiveStage(workflowStagesService.activeStage)
    );

    return () => {
      unsubStagesChanged();
      unsubActiveStageChanged();
    }
  }, [servicesManager]);

  return (
    <StepProgressDropdown id="options" options={dropdownOptions} value={activeStage?.id} onChange={handleDropdownChange} />
  );
}

export default StepProgressDropdownWithService;
