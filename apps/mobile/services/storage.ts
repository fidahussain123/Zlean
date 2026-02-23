import { supabase } from '@/lib/supabase';

/**
 * Upload a car photo to Supabase Storage bucket 'car-photos'.
 * Path format: {shop_id}/{car_plate}/{timestamp}.jpg
 * Returns the public URL of the uploaded image.
 */
export async function uploadCarPhoto(
    fileUri: string,
    shopId: string,
    carPlate: string
): Promise<string> {
    try {
        const filename = `${shopId}/${carPlate}/${Date.now()}.jpg`;

        // Fetch the file from the URI
        const response = await fetch(fileUri);
        const blob = await response.blob();

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('car-photos')
            .upload(filename, blob, {
                contentType: 'image/jpeg',
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('car-photos')
            .getPublicUrl(filename);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error('Error uploading photo:', error);
        throw new Error('Upload failed');
    }
}
