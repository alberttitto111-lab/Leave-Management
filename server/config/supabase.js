import { createClient } from "@supabase/supabase-js";
import { generateFileName } from "../utils/idGenerator.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadToSupabase = async (
  file,
  userId,
  folder = "leave-documents",
) => {
  try {
    const fileName = generateFileName(file.originalname, userId, folder);

    const { data, error } = await supabase.storage
      .from("leave-management")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        cacheControl: "3600",
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("leave-management").getPublicUrl(fileName);

    return {
      url: publicUrl,
      path: fileName,
      name: file.originalname,
      type: file.mimetype,
    };
  } catch (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
};

export const deleteFromSupabase = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from("leave-management")
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
};
