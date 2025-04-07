'use client';

import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeContext } from '@/app/theme/useThemeContext.hook';

export const  ThemeToggle = ()=> {
  const { mode, toggleColorMode } = useThemeContext();

  return (
    <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
      <IconButton 
        onClick={toggleColorMode} 
        color="inherit"
        sx={{ ml: 1 }}
        aria-label="toggle theme"
      >
        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
}