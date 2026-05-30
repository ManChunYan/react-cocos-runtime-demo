import { Button, Box } from "@mui/material";
import type { PetAction } from "@feedpets/protocol";

export type ActionButtonProps = {
  action: PetAction;
  label: string;
  src: string;
};

type PetActionButtonProps = ActionButtonProps & {
  disabled?: boolean;
  onAction: (action: PetAction) => void;
};

export function PetActionButton({
  action,
  disabled = false,
  label,
  src,
  onAction,
}: PetActionButtonProps) {
  return (
    <Button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => onAction(action)}
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        maxWidth: { xs: 172, sm: 188 },
        aspectRatio: "47 / 22",
        p: 0,
        borderRadius: 0,
        backgroundColor: "transparent",
        transition: "transform 140ms ease",
        "&:hover": {
          backgroundColor: "transparent",
          transform: "translateY(-2px)",
        },
        "&:active": {
          transform: "translateY(1px)",
        },
        "&.Mui-disabled": {
          opacity: 0.45,
        },
      }}
    >
      <Box
        component="img"
        src={src}
        alt=""
        draggable={false}
        sx={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />
    </Button>
  );
}
