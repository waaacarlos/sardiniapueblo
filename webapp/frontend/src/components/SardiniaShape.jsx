import sardiniaSvg from "../../assets/sardinia-bg.svg";
import { Box } from "@mui/material";


export default function SardiniaShape() {
  return (
    <Box  className="sardinia-mask-wrap"
    >
      <Box
        className="sardinia-mask"
        sx={{
          "--sardinia-url": `url(${sardiniaSvg})`,
        }}
      />
    </Box>
  );
}
