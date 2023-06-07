import React, { useEffect, useState, useCallback } from 'react';
import StepProgressDropdownWithService from './StepProgressDropdownWithService';

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
  const [stages, setStages] = useState(workflowStagesService.stages);
  const [activeStage, setActiveStage] = useState(workflowStagesService.activeStage);

  const handleStageSelected = useCallback((stage) => {
    workflowStagesService.setActiveStage(stage.id);
  }, [workflowStagesService]);

  useEffect(() => {
    const { unsubscribe } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.STAGES_CHANGED,
      () => setStages(workflowStagesService.stages)
    );

    return () => {
      unsubscribe();
    }
  }, [servicesManager]);

  useEffect(() => {
    const { unsubscribe } = workflowStagesService.subscribe(
      workflowStagesService.EVENTS.ACTIVE_STAGE_CHANGED,
      () => setActiveStage(workflowStagesService.activeStage)
    );

    return () => {
      unsubscribe();
    }
  }, [servicesManager]);

  const stagesContent = stages.map(stage => {
    return (
      <div
        key={stage.id}
        onClick={() => handleStageSelected(stage)}
        style={ stage.id === activeStage?.id ? styles.listItemSelected : styles.listItem }
      >
        { stage.id === activeStage?.id && '[' } { stage.name } { stage.id === activeStage?.id && ']' }
      </div>
    );
  });

  return (
    <div data-cy={'workflow-panel'} style={styles.panel}>
      <div style={styles.title}>Workflow</div>
      <div style={styles.container}>
        { stagesContent }
      </div>
      <div style={{ backgroundColor: '#041c4a', padding: '10px 5px' }}>
        <StepProgressDropdownWithService servicesManager={servicesManager} />
      </div>
    </div>
  );
}

export default WorkflowPanel;
