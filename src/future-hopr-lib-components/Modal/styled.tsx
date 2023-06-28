import styled from '@emotion/styled';
import {
  Dialog,
  DialogContent,
  IconButton
} from '@mui/material'

export const SDialog = styled(Dialog)`
  .MuiPaper-root {
    width: 100%;
  }
`
export const TopBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

export const SDialogContent = styled(DialogContent)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const SIconButton = styled(IconButton)`
  height: 32px;
  width: 32px;
  margin: 16px;
`