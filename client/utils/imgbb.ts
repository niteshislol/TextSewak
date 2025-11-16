const IMGBB_API_KEY = "436cbb9c7f4064fb162bb9b8fc702569";
const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

export async function uploadToImgBB(
  file: File | string,
  userId: string,
): Promise<{ url: string; deleteUrl: string } | null> {
  try {
    let blob: Blob;

    if (typeof file === "string") {
      const response = await fetch(file);
      blob = await response.blob();
    } else {
      blob = file;
    }

    const base64Data = await blobToBase64(blob);
    const base64String = base64Data.split(",")[1];

    const formData = new FormData();
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", base64String);
    formData.append("name", `${userId}_${Date.now()}`);

    const response = await fetch(IMGBB_API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ImageBB API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || "Unknown ImageBB error");
    }

    return {
      url: data.data.display_url,
      deleteUrl: data.data.delete_url,
    };
  } catch (error) {
    console.error("Failed to upload to ImageBB:", error);
    return null;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
