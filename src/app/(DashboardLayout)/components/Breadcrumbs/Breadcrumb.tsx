import NextLink from "next/link";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";

interface BreadcrumbProps {
  pageName?: string | null;
}

const orangeText = "var(--primary-1-text-color)";

const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");

const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  const pathSegments = (pageName ?? "").split("/").filter((segment) => segment);
  const currentPage = pathSegments[0] ?? "";
  const filteredSegments = pathSegments.slice(1);

  if (!currentPage) {
    return null;
  }

  return (
    <Breadcrumbs aria-label="breadcrumb">
      {/* <NextLink href={`/${tenantName}`} passHref legacyBehavior> */}
      <NextLink href={`/${currentPage}`} passHref legacyBehavior>
        <Typography
          component="a"
          sx={{
            fontWeight: "medium",
            color: orangeText,
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          { capitalizeFirstLetter(currentPage)}
        </Typography>
      </NextLink>

      {filteredSegments.map((segment, index) => {
        const fullPath = `/${currentPage}/${filteredSegments.slice(0, index + 1).join("/")}`;
        const label = capitalizeFirstLetter(segment);

        const isLast = index === filteredSegments.length - 1;

        return isLast ? (
          <Typography
            key={index}
            sx={{
              fontWeight: "medium",
              color: orangeText,
            }}
          >
            {label}
          </Typography>
        ) : (
          <NextLink key={index} href={fullPath} passHref legacyBehavior>
            <Typography
              component="a"
              sx={{
                fontWeight: "medium",
                color: orangeText,
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              {label}
            </Typography>
          </NextLink>
        );
      })}
    </Breadcrumbs>
  );
};

export default Breadcrumb;
