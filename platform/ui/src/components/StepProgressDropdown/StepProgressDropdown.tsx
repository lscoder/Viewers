import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon } from '../';
import './StepProgressDropdown.css';

const StepProgressStatus = ({ max, value }) => {
  const items: JSX.Element[] = [];

  for (let i = 1; i <= max; i++) {
    const completed = i <= value;

    items.push(
      <div
        key={i}
        className={classnames(
          'h-1 grow mr-1 last:mr-0 first:rounded-l-sm last:rounded-r-sm',
          {
            'bg-black': !completed,
            'bg-primary-light': completed,
          }
        )}
      ></div>
    );
  }

  return <div className="flex">{items}</div>;
};

StepProgressStatus.propTypes = {
  max: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const StepProgressDropdownItem = ({
  label,
  value,
  info,
  completed,
  onSelect,
}) => {
  let icon;
  let showInfoTooltip = false;

  if (completed) {
    icon = 'status-tracked';
  } else if (info) {
    icon = 'launch-info';
    showInfoTooltip = true;
  }

  const handleInfoIconClick = useCallback(event => {
    console.log('>>>>> handleInfoIconClick ::', event);
    // event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    // <div
    //   key={value}
    //   className={classnames(
    //     'flex px-4 py-2 cursor-pointer items-center hover:bg-secondary-main',
    //     'transition duration-300 border-b last:border-b-0 border-secondary-main'
    //   )}
    //   onClick={() => onSelect()}
    // >
    //   {!!icon && <Icon name={icon} className="w-4 mr-2 text-white" />}
    //   <Typography>{label}</Typography>
    // </div>
    <div
      key={value}
      className="flex py-1 cursor-pointer hover:bg-secondary-main transition duration-1000"
      onClick={() => onSelect()}
    >
      <Icon
        name={icon}
        onClick={showInfoTooltip ? handleInfoIconClick : undefined}
        className="grow-0 text-primary-light h-4 w-4 mt-1 mr-2 mb-0 ml-1"
      />
      <div className="grow text-base leading-6">{label}</div>
    </div>
  );
};

StepProgressDropdownItem.defaultProps = {
  info: '',
};

StepProgressDropdownItem.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  info: PropTypes.string,
  completed: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const StepProgressDropdown = ({ id, options, value, children, onChange }) => {
  const [selectedOption, setSelectedOption] = useState(
    value && options.find(option => option.value === value)
  );
  const selectedOptionIndex = useMemo(() => options.indexOf(selectedOption), [
    options,
    selectedOption,
  ]);
  const [selectedOptions, setSelectedOptions] = useState(
    selectedOption ? [selectedOption.value] : []
  );
  const canMoveNext = useMemo(() => selectedOptionIndex < options.length - 1, [
    selectedOptionIndex,
    options,
  ]);

  const [open, setOpen] = useState(false);
  const element = useRef(null);
  const toggleOptions = () => setOpen(s => !s);

  const handleDocumentClick = e => {
    if (element.current && !element.current.contains(e.target)) {
      setOpen(false);
    }
  };

  const handleSelectedOption = useCallback(
    newSelectedOption => {
      setOpen(false);

      if (newSelectedOption?.value === selectedOption?.value) {
        return;
      }

      setSelectedOption(newSelectedOption);

      if (
        newSelectedOption &&
        !selectedOptions.includes(newSelectedOption.value)
      ) {
        setSelectedOptions([...selectedOptions, newSelectedOption.value]);
      }

      if (newSelectedOption?.onSelect) {
        newSelectedOption.onSelect();
      }

      if (onChange) {
        onChange({ selectedOption: newSelectedOption });
      }
    },
    [selectedOption, selectedOptions, onChange]
  );

  const handleNextButtonClick = useCallback(() => {
    if (canMoveNext) {
      handleSelectedOption(options[selectedOptionIndex + 1]);
    }
  }, [options, selectedOptionIndex, canMoveNext, handleSelectedOption]);

  useEffect(() => {
    const newOption = value && options.find(option => option.value === value);
    handleSelectedOption(newOption);
  }, [options, selectedOption, value, handleSelectedOption]);

  const renderOptions = () => {
    return (
      <div
        className={classnames(
          'absolute top-7 mt-0.5 left-0 right-8 z-10 origin-top-right',
          'transition duration-300 transform bg-primary-dark',
          'border border-secondary-main rounded shadow',
          {
            'scale-0': !open,
            'scale-100': open,
          }
        )}
      >
        {options.map((item, index) => (
          <StepProgressDropdownItem
            key={index}
            value={item.value}
            label={item.label}
            info={item.info}
            completed={selectedOptions.includes(item.value)}
            onSelect={() => handleSelectedOption(item)}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);

    if (!open) {
      document.removeEventListener('click', handleDocumentClick);
    }
  }, [open]);

  return (
    <div ref={element} style={{ fontSize: 0 }} className="relative">
      <div>
        <div className="flex mb-1.5" style={{ height: '26px' }}>
          <div
            className="flex grow border border-primary-main rounded cursor-pointer"
            onClick={toggleOptions}
          >
            <div className="flex grow">
              <Icon
                name="status-tracked"
                className="grow-0 text-primary-light h-4 w-4 mt-1 mr-2 mb-0 ml-1"
              />
              <div className="grow text-base leading-6">
                {selectedOption ? selectedOption.label : children}
              </div>
            </div>
            <Icon
              name="chevron-down"
              className="text-primary-active mt-0.5 ml-1"
            />
          </div>
          <button
            className={classnames('text-base rounded ml-1.5', {
              'bg-primary-main': canMoveNext,
              'bg-primary-dark pointer-events-none': !canMoveNext,
            })}
            style={{ width: '26px' }}
          >
            <Icon
              name="arrow-right"
              className={classnames('text-white relative left-0.5 w-6 h-6', {
                'text-white': canMoveNext,
                'text-secondary-light': !canMoveNext,
              })}
              onClick={handleNextButtonClick}
            />
          </button>
        </div>
        {renderOptions()}
        <div>
          <StepProgressStatus
            max={options.length}
            value={selectedOptionIndex + 1}
          />
        </div>
      </div>
    </div>
  );
};

StepProgressDropdown.defaultProps = {
  // showDropdownIcon: true,
};

StepProgressDropdown.propTypes = {
  id: PropTypes.string,
  children: PropTypes.node.isRequired,
  // showDropdownIcon: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onSelect: PropTypes.func,
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default StepProgressDropdown;
