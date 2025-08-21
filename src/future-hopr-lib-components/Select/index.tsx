import React from 'react';
import styled from '@emotion/styled';

//mui
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import SelectMui, { SelectProps as SelectMuiProps } from '@mui/material/Select';
import { Tooltip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const SFormControl = styled(FormControl)`
  margin-bottom: 16px;
  margin-top: 24px;
  label {
    font-size: 17px;
  }
  .MuiOutlinedInput-root {
    font-size: 17px;
  }
  .MuiFormLabel-root.MuiInputLabel-shrink {
    color: #000030;
  }
  .MuiInputBase-root {
    button.removeValue {
      display: none;
    }
  }
  .MenuItem-icon {
    height: 18px;
    width: 22px;
    display: inline-block;
    position: relative;
    margin-right: 8px;
    img {
      margin-right: 8px;
      height: 22px;
      width: 22px;
      margin: 0;
      padding: 0;
      left: 0px;
      position: absolute;
    }
  }
`;

const SMenuItem = styled(MenuItem)`
  .MenuItem-icon {
    height: 18px;
    width: 22px;
    display: inline-block;
    position: relative;
    margin-right: 8px;
    img {
      margin-right: 8px;
      height: 22px;
      width: 22px;
      margin: 0;
      padding: 0;
      left: 0px;
      position: absolute;
    }
  }
`;

type Props = SelectMuiProps & {
  removeValue?: (value: number) => void;
  removeValueTooltip?: string;
  values?: {
    value: string | number;
    name: string | number | null;
    disabled?: boolean;
    icon?: React.ReactNode;
  }[];
  native?: boolean;
};

const Select: React.FC<Props> = (props) => {
  return (
    <SFormControl style={props.style}>
      <InputLabel id="select-small">{props.label}</InputLabel>
      <SelectMui
        labelId="select-small"
        id="select-small"
        size={props.size}
        value={props.value}
        onChange={props.onChange}
        label={props.label}
        disabled={props.disabled}
        native={props.native}
        MenuProps={{ disableScrollLock: true }}
      >
        {props.values &&
          props.values.map((elem, index) => (
            <SMenuItem
              value={elem.value}
              disabled={elem.disabled}
              key={`${elem.value}_${elem.name}_${index}`}
              style={props.removeValue && { justifyContent: 'space-between' }}
            >
              {elem.icon && <div className="MenuItem-icon">{elem.icon}</div>}
              {elem.name}
              {props.removeValue && (
                <Tooltip title={props.removeValueTooltip}>
                  <IconButton
                    aria-label="delete"
                    className="removeValue"
                    onClick={(event) => {
                      event.stopPropagation();
                      props?.removeValue?.(Number(elem.value));
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </SMenuItem>
          ))}
      </SelectMui>
    </SFormControl>
  );
};

export default Select;
