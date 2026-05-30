import { useCallback, type ReactNode } from "react";
import { PET_GAME_EVENT } from "@feedpets/protocol";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { useCocosEventBridge } from "../../contexts/EventBridgeContext";
import danceButtonSrc from "../../assets/button_dance.png";
import feedButtonSrc from "../../assets/button_feed.png";
import petButtonSrc from "../../assets/button_pet.png";

import { type ActionButtonProps, PetActionButton } from "./PetActionButton";

type InteractiveButtonsLayoutProps = {
  children: ReactNode;
};

const actionButtons: ActionButtonProps[] = [
  { action: "dance", label: "Dance", src: danceButtonSrc },
  { action: "feed", label: "Feed", src: feedButtonSrc },
  { action: "pet", label: "Pet", src: petButtonSrc },
];

export function InteractiveButtonsLayout({
  children,
}: InteractiveButtonsLayoutProps) {
  const { dispatchEventToCocos, isReady } = useCocosEventBridge();

  const handleAction = useCallback(
    (action: ActionButtonProps["action"]) => {
      dispatchEventToCocos(PET_GAME_EVENT.ACTION, { action });
    },
    [dispatchEventToCocos],
  );

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {children}
      {isReady && (
        <Stack
          direction="row"
          sx={{
            position: "absolute",
            left: "50%",
            bottom: {
              xs: "max(12px, env(safe-area-inset-bottom))",
              sm: "max(20px, env(safe-area-inset-bottom))",
            },
            transform: "translateX(-50%)",
            zIndex: 1,
            width: "min(calc(100% - 24px), 612px)",
            justifyContent: "center",
            gap: { xs: 0.75, sm: 1.25, md: 1.5 },
            px: { xs: 0.5, sm: 0 },
          }}
        >
          {actionButtons.map((button) => (
            <PetActionButton
              key={button.action}
              {...button}
              onAction={handleAction}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
