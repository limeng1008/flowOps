export default function componentStyleOverrides(theme) {
    const isDark = theme?.customization?.isDarkMode
    const bgColor = isDark ? theme.colors?.darkPrimary800 : 'rgba(255, 255, 255, 0.46)'
    const glassBlur = theme.colors?.glassBlur || '22px'
    const glassSurface = isDark ? theme.colors?.glassDarkSurface : theme.colors?.glassLightSurface
    const glassSurfaceStrong = isDark ? theme.colors?.glassDarkSurfaceStrong : theme.colors?.glassLightSurfaceStrong
    const glassBorder = isDark ? theme.colors?.glassDarkBorder : theme.colors?.glassBorder
    const glassHighlight = isDark ? theme.colors?.glassDarkHighlight : theme.colors?.glassHighlight
    const glassShadow = isDark ? theme.colors?.glassShadowDark : theme.colors?.glassShadowLight
    const glassBackdrop = `blur(${glassBlur}) saturate(1.45)`
    const appBackground = isDark
        ? 'radial-gradient(900px 520px at 12% 8%, rgba(9,124,255,0.18), transparent 58%), radial-gradient(820px 500px at 88% 16%, rgba(20,184,166,0.14), transparent 56%), linear-gradient(135deg, #07101d 0%, #111827 46%, #0f172a 100%)'
        : 'radial-gradient(900px 520px at 12% 8%, rgba(9,124,255,0.20), transparent 58%), radial-gradient(820px 500px at 88% 16%, rgba(20,184,166,0.18), transparent 56%), linear-gradient(135deg, #eef7ff 0%, #f8fbff 46%, #f1fff9 100%)'
    const glassBackground = `linear-gradient(145deg, ${glassHighlight}, transparent 34%), ${glassSurface}`
    const strongGlassBackground = `linear-gradient(145deg, ${glassHighlight}, transparent 30%), ${glassSurfaceStrong}`

    return {
        MuiCssBaseline: {
            styleOverrides: {
                html: {
                    minHeight: '100%',
                    background: isDark ? '#07101d' : '#eef7ff'
                },
                body: {
                    minHeight: '100vh',
                    background: appBackground,
                    backgroundAttachment: 'fixed',
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDark
                        ? `${theme.colors?.grey500} ${theme.colors?.darkPrimaryMain}`
                        : `${theme.colors?.grey300} transparent`,
                    '&::before': {
                        content: '""',
                        position: 'fixed',
                        inset: 0,
                        zIndex: -1,
                        pointerEvents: 'none',
                        opacity: isDark ? 0.22 : 0.5,
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.42) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.36) 1px, transparent 1px)',
                        backgroundSize: '44px 44px',
                        maskImage: 'linear-gradient(180deg, transparent, #000 18%, #000 74%, transparent)'
                    },
                    '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                        width: 12,
                        height: 12,
                        backgroundColor: 'transparent'
                    },
                    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                        borderRadius: 8,
                        backgroundColor: isDark ? theme.colors?.grey500 : theme.colors?.grey300,
                        minHeight: 24,
                        border: `3px solid ${isDark ? theme.colors?.darkPrimaryMain : 'rgba(255,255,255,0.42)'}`
                    },
                    '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                        backgroundColor: isDark ? theme.colors?.darkPrimary200 : theme.colors?.grey500
                    },
                    '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                        backgroundColor: isDark ? theme.colors?.darkPrimary200 : theme.colors?.grey500
                    },
                    '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: isDark ? theme.colors?.darkPrimary200 : theme.colors?.grey500
                    },
                    '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
                        backgroundColor: 'transparent'
                    }
                },
                '#root': {
                    minHeight: '100vh',
                    isolation: 'isolate'
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: strongGlassBackground,
                    borderBottom: `1px solid ${glassBorder}`,
                    boxShadow: 'none',
                    backdropFilter: glassBackdrop,
                    WebkitBackdropFilter: glassBackdrop
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    fontWeight: 650,
                    borderRadius: '999px',
                    textTransform: 'none',
                    transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
                    '&:active': {
                        transform: 'scale(0.98)'
                    }
                },
                contained: {
                    backgroundImage: `linear-gradient(145deg, rgba(255,255,255,0.28), transparent 42%)`,
                    boxShadow: `0 14px 30px ${isDark ? 'rgba(0,0,0,0.28)' : 'rgba(2,132,199,0.22)'}`,
                    '&:hover': {
                        boxShadow: `0 18px 36px ${isDark ? 'rgba(0,0,0,0.34)' : 'rgba(2,132,199,0.28)'}`
                    }
                },
                outlined: {
                    background: glassBackground,
                    borderColor: glassBorder,
                    backdropFilter: glassBackdrop,
                    WebkitBackdropFilter: glassBackdrop
                }
            }
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    color: isDark ? theme.colors?.paper : 'inherit'
                }
            }
        },
        MuiPaper: {
            defaultProps: {
                elevation: 0
            },
            styleOverrides: {
                root: {
                    background: glassBackground,
                    backgroundImage: `linear-gradient(145deg, ${glassHighlight}, transparent 34%)`,
                    border: `1px solid ${glassBorder}`,
                    boxShadow: glassShadow,
                    backdropFilter: glassBackdrop,
                    WebkitBackdropFilter: glassBackdrop
                },
                rounded: {
                    borderRadius: `${theme?.customization?.borderRadius}px`
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    background: glassBackground,
                    border: `1px solid ${glassBorder}`,
                    boxShadow: glassShadow,
                    backdropFilter: glassBackdrop,
                    WebkitBackdropFilter: glassBackdrop
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    background: strongGlassBackground,
                    borderColor: glassBorder,
                    boxShadow: glassShadow,
                    backdropFilter: glassBackdrop,
                    WebkitBackdropFilter: glassBackdrop
                }
            }
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    background: strongGlassBackground,
                    border: `1px solid ${glassBorder}`,
                    boxShadow: glassShadow,
                    backdropFilter: glassBackdrop,
                    WebkitBackdropFilter: glassBackdrop
                }
            }
        },
        MuiPopover: {
            styleOverrides: {
                paper: {
                    background: strongGlassBackground,
                    border: `1px solid ${glassBorder}`,
                    boxShadow: glassShadow,
                    backdropFilter: glassBackdrop,
                    WebkitBackdropFilter: glassBackdrop
                }
            }
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    color: theme.colors?.textDark,
                    padding: '24px'
                },
                title: {
                    fontSize: '1.125rem'
                }
            }
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '24px'
                }
            }
        },
        MuiCardActions: {
            styleOverrides: {
                root: {
                    padding: '24px'
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    '&.Mui-selected': {
                        color: theme.menuSelected,
                        background: isDark ? 'rgba(94, 234, 212, 0.14)' : 'rgba(20, 184, 166, 0.14)',
                        boxShadow: `inset 0 0 0 1px ${glassBorder}`,
                        '&:hover': {
                            background: isDark ? 'rgba(94, 234, 212, 0.18)' : 'rgba(20, 184, 166, 0.18)'
                        },
                        '& .MuiListItemIcon-root': {
                            color: theme.menuSelected
                        }
                    },
                    '&:hover': {
                        background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.50)',
                        color: theme.menuSelected,
                        '& .MuiListItemIcon-root': {
                            color: theme.menuSelected
                        }
                    }
                }
            }
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: theme.darkTextPrimary,
                    minWidth: '36px'
                }
            }
        },
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    color: theme.textDark
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                input: {
                    color: theme.textDark,
                    '&::placeholder': {
                        color: theme.darkTextSecondary,
                        fontSize: '0.875rem'
                    },
                    '&.Mui-disabled': {
                        WebkitTextFillColor: theme?.customization?.isDarkMode ? theme.colors?.grey500 : theme.darkTextSecondary
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    background: bgColor,
                    borderRadius: `${theme?.customization?.borderRadius}px`,
                    backdropFilter: `blur(calc(${glassBlur} * 0.64)) saturate(1.25)`,
                    WebkitBackdropFilter: `blur(calc(${glassBlur} * 0.64)) saturate(1.25)`,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: glassBorder
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.colors?.primary200
                    },
                    '&.MuiInputBase-multiline': {
                        padding: 1
                    }
                },
                input: {
                    fontWeight: 500,
                    background: 'transparent',
                    padding: '15.5px 14px',
                    borderRadius: `${theme?.customization?.borderRadius}px`,
                    '&.MuiInputBase-inputSizeSmall': {
                        padding: '10px 14px',
                        '&.MuiInputBase-inputAdornedStart': {
                            paddingLeft: 0
                        }
                    }
                },
                inputAdornedStart: {
                    paddingLeft: 4
                },
                notchedOutline: {
                    borderRadius: `${theme?.customization?.borderRadius}px`
                }
            }
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    '&.Mui-disabled': {
                        color: theme.colors?.grey300
                    }
                },
                mark: {
                    backgroundColor: theme.paper,
                    width: '4px'
                },
                valueLabel: {
                    color: theme?.colors?.primaryLight
                }
            }
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: glassBorder,
                    opacity: 1
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    color: theme.colors?.primaryDark,
                    background: theme.colors?.primary200
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    '&.MuiChip-deletable .MuiChip-deleteIcon': {
                        color: 'inherit'
                    }
                }
            }
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    color: isDark ? theme.colors?.paper : theme.textDark,
                    background: strongGlassBackground,
                    border: `1px solid ${glassBorder}`,
                    boxShadow: glassShadow,
                    backdropFilter: glassBackdrop,
                    WebkitBackdropFilter: glassBackdrop
                }
            }
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    background: glassBackground,
                    border: `1px solid ${glassBorder}`,
                    boxShadow: glassShadow,
                    backdropFilter: glassBackdrop,
                    WebkitBackdropFilter: glassBackdrop
                }
            }
        },
        MuiAutocomplete: {
            styleOverrides: {
                option: {
                    '&:hover': {
                        background: isDark ? 'rgba(255,255,255,0.10) !important' : 'rgba(255,255,255,0.58) !important'
                    }
                }
            }
        }
    }
}
