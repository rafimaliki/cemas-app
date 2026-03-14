import { Hono } from "hono";
import { createTag, getTags, getTagById, deleteTag,getTagsWithCriteria,addCriteriaToTag,removeCriteriaFromTag,updateTag } from "@/controllers/tag-controller.ts";
import { authMiddleware,roleMiddleware } from "@/middleware/auth-middleware.ts";  

const tagRouter = new Hono();

tagRouter.use("*", authMiddleware,roleMiddleware(["Administrator"]));

tagRouter.post("/create",createTag);
tagRouter.get("/", getTags);
tagRouter.get("/with-criteria", getTagsWithCriteria);
tagRouter.get("/:id", getTagById);
tagRouter.delete("/:id/delete",deleteTag);
tagRouter.put("/:id/update", updateTag);

// New endpoints for CriteriaTags
tagRouter.post("/associate-criteria", addCriteriaToTag);
tagRouter.delete("/disassociate-criteria", removeCriteriaFromTag);

export default tagRouter;
