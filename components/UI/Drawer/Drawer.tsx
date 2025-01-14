import { useWindowSize } from "@/hooks/useWindowSize";
import { useDrawerData, useIsDrawerOpen } from "@/stores/mapStore";
import { OpenInNew } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { Snackbar, TextField, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { default as MuiDrawer } from "@mui/material/Drawer";
import formatcoords from "formatcoords";
import React, {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import styles from "./Drawer.module.css";

interface DrawerProps {
  toggler: (_e: KeyboardEvent | MouseEvent) => void;
}

const generateGoogleMapsUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps/@${lat},${lng},22z`;
};

const generateGoogleMapsDirectionUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps?saddr=My+Location&daddr=${lat},${lng}`;
};

const googleMapsButtons = [
  { label: "Google Haritalar ile Gör", urlCallback: generateGoogleMapsUrl },
  { label: "Yol Tarifi Al", urlCallback: generateGoogleMapsDirectionUrl },
];

const Drawer = ({ toggler }: DrawerProps) => {
  const isOpen = useIsDrawerOpen();
  const data = useDrawerData();
  const size = useWindowSize();
  const [openBillboardSnackbar, setOpenBillboardSnackbar] = useState(false);
  const anchor = useMemo(
    () => (size.width > 768 ? "left" : "bottom"),
    [size.width]
  );

  function copyBillboard(url: string) {
    navigator.clipboard.writeText(url);
    setOpenBillboardSnackbar(true);
  }

  const list = useMemo(() => {
    if (!data) {
      return null;
    }

    const { geometry, formatted_address, source } = data;
    const formattedCoordinates = formatcoords([
      geometry.location.lat,
      geometry.location.lng,
    ]).format();

    return (
      <Box
        sx={{
          width: size.width > 768 ? 372 : "full",
          display: "flex",
          flexDirection: "column",
        }}
        role="presentation"
        onKeyDown={(e) => toggler(e)}
      >
        <div className={styles.content}>
          {/* <Tag color={Tags["mid"]?.color}>{Tags["mid"]?.intensity}</Tag> */}
          <h3>{formatted_address}</h3>
          <p>{formattedCoordinates}</p>
          <div className={styles.contentButtons}>
            {googleMapsButtons.map((button) => (
              <Button
                key={button.label}
                variant="contained"
                onClick={() =>
                  window.open(
                    button.urlCallback(
                      geometry.location.lat,
                      geometry.location.lng
                    ),
                    "_blank"
                  )
                }
                className={styles.externalLinkButton}
              >
                {button.label}
                <OpenInNew className={styles.openInNewIcon} />
              </Button>
            ))}
          </div>
          <div>
            <TextField
              fullWidth
              variant="standard"
              value={generateGoogleMapsUrl(
                geometry.location.lat,
                geometry.location.lng
              )}
              InputProps={{
                sx: { paddingRight: "1rem" },
                readOnly: true,
              }}
            />
            <div className={styles.actionButtons}>
              <Button
                variant="outlined"
                className={styles.clipboard}
                size="small"
                onClick={() =>
                  copyBillboard(
                    `https://www.google.com/maps/@${geometry.location.lat.toString()},${geometry.location.lng.toString()},22z`
                  )
                }
              >
                ADRESİ KOPYALA
              </Button>
              <Button
                variant="outlined"
                className={styles.clipboard}
                size="small"
                onClick={() =>
                  window.open(
                    `https://twitter.com/anyuser/status/${source.tweet_id}`
                  )
                }
              >
                Kaynak
              </Button>
            </div>
          </div>
          <div className={styles.sourceContent}>
            <Typography className={styles.sourceContentTitle}>
              Yardım İçeriği
            </Typography>
            <div className={styles.sourceContentText}>
              <Typography>{source?.full_text}</Typography>
            </div>
          </div>
        </div>
        <CloseIcon onClick={(e) => toggler(e)} className={styles.closeButton} />
      </Box>
    );
  }, [data, size.width, toggler]);

  const handleClose = useCallback((e: MouseEvent) => toggler(e), [toggler]);

  return (
    <div>
      <Snackbar
        open={openBillboardSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenBillboardSnackbar(false)}
        message="Adres Kopyalandı"
      />
      <MuiDrawer
        className="drawer"
        anchor={anchor}
        open={isOpen}
        onClose={handleClose}
      >
        {list}
      </MuiDrawer>
    </div>
  );
};

export default React.memo(Drawer);
