import React from "react";
import { Box, Skeleton, Paper, Typography } from "@mui/material";

const KanbanBoardSkeleton = () => {
    // Sample column definitions to match the image
    const columns = [
        { id: "to_do", title: "TO DO" },
        { id: "in_progress", title: "IN PROGRESS" },
        { id: "on_hold", title: "ON HOLD" },
        { id: "testable", title: "TESTABLE" },
        { id: "completed", title: "COMPLETED" },
    ];

    // Number of skeleton cards per column (adjust based on your needs)
    const cardsPerColumn = [4, 4, 4, 4, 4]; // Matches the image's task counts

    return (
        <Box
            sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                backgroundColor: "transparent",
                ml:2
            }}
        >
            {columns.map((column, index) => (
                <Box
                    key={column.id}
                    sx={{
                        width: 240,
                        flexShrink: 0,
                    }}
                >
                    <Paper
                        sx={{
                            px: 0.5,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: 2,
                            height: "100%",
                            overflowY: "auto",
                            "&::-webkit-scrollbar": { display: "none" },
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                position: "sticky",
                                top: 0,
                                backgroundColor: "#ffffff",
                                borderRadius: 2,
                                padding: "10px 8px",
                                zIndex: 1,
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    fontSize: 14,
                                    fontWeight: "bold",
                                    color: "#172b4d",
                                    textTransform: "uppercase",
                                }}
                            >
                                {column.title}
                            </Typography>
                            <Skeleton variant="text" width={40} height={20} />
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                mt: 2,
                                minHeight: "100px",
                            }}
                        >
                            {Array.from({ length: cardsPerColumn[index] }).map((_, cardIndex) => (
                                <Box
                                    key={cardIndex}
                                    sx={{
                                        marginBottom: "1rem",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    <Skeleton
                                        variant="rectangular"
                                        height={120}
                                        sx={{
                                            borderRadius: 2,
                                            backgroundColor: "#d3d3d3",
                                            position: "relative",
                                            "&::after": {
                                                content: '""',
                                                position: "absolute",
                                                top: "-50%",
                                                left: "-100%",
                                                width: "50%",
                                                height: "200%",
                                                background: "linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0))",
                                                transform: "rotate(45deg)",
                                                animation: "shine 3s infinite linear",
                                            },
                                            "@keyframes shine": {
                                                "0%": { left: "-100%" },
                                                "100%": { left: "150%" },
                                            },
                                        }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Box>
            ))}
        </Box>
    );
};

export default KanbanBoardSkeleton;