import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { StepProgressDropdown } from '@ohif/ui';

const styles = {
  panel: {
    marginBottom: '10px'
  },
  title: {
  },
  container: {
    fontSize: '12px',
    padding: '10px',
  },
  listItem: {
    cursor: 'pointer',
  },
  listItemSelected: {
    cursor: 'pointer',
    color: '#0f0',
  },
}

function WorkflowPanel({ servicesManager }) {
  const { workflowStagesService } = servicesManager.services;
  const [workflowStages, setWorkflowStages] = useState(workflowStagesService.workflowStages);
  const [activeWorkflowStage, setActiveWorkflowStage] = useState(workflowStagesService.activeWorkflowStage);

  const handleStageSelected = useCallback((workflowStage) => {
    workflowStagesService.setActiveWorkflowStage(workflowStage.id);
  }, [workflowStagesService]);

  useEffect(() => {
    const { unsubscribe } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.STAGES_CHANGED,
      () => setWorkflowStages(workflowStagesService.workflowStages)
    );

    return () => {
      unsubscribe();
    }
  }, [servicesManager]);

  useEffect(() => {
    const { unsubscribe } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.ACTIVE_STAGE_CHANGED,
      () => setActiveWorkflowStage(workflowStagesService.activeWorkflowStage)
    );

    return () => {
      unsubscribe();
    }
  }, [servicesManager]);

  const workflowStagesContent = workflowStages.map(workflowStage => {
    return (
      <div
        key={workflowStage.id}
        onClick={() => handleStageSelected(workflowStage)}
        style={ workflowStage.id === activeWorkflowStage?.id ? styles.listItemSelected : styles.listItem }
      >
        { workflowStage.id === activeWorkflowStage?.id && '[' } { workflowStage.name } { workflowStage.id === activeWorkflowStage?.id && ']' }
      </div>
    );
  });

  const menuOptions = useMemo(() => (
    workflowStages.map(workflowStage => (
      {
        label: workflowStage.name,
        value: workflowStage.id,
        icon: 'info',
        info: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
      }
    ))
  ), [workflowStages]);

  const handleDropdownChange = ({ selectedOption }) => {
    if (!selectedOption) {
      return;
    }

    const workflowStage = workflowStages.find(workflowStage => workflowStage.id === selectedOption.value);
    handleStageSelected(workflowStage);
  };

  return (
    <div data-cy={'workflow-panel'} style={styles.panel}>
      <div style={styles.title}>Workflow</div>
      <div style={styles.container}>
        { workflowStagesContent }
      </div>
      <div style={{ backgroundColor: '#041c4a', padding: '10px 5px' }}>
        <StepProgressDropdown id="options" options={menuOptions} value={activeWorkflowStage?.id} onChange={handleDropdownChange}></StepProgressDropdown>
      </div>
    </div>
  );
}

export default WorkflowPanel;
