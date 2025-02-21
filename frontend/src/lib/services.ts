import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  location: string;
  availability: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  tags: string[];
  images: string[];
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
  provider?: {
    full_name: string;
    rating: number;
    total_reviews: number;
  };
}

export interface ServiceFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string[];
  location?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
  provider_id?: string;
}

export interface ServiceSort {
  field: 'price' | 'rating' | 'created_at';
  direction: 'asc' | 'desc';
}

export async function getServices(
  filter?: ServiceFilter,
  sort?: ServiceSort,
  page = 1,
  limit = 12
) {
  let query = supabase
    .from('services')
    .select(`
      *,
      provider:profiles!provider_id (
        full_name
      ),
      images:service_images (
        url,
        order
      ),
      reviews:service_reviews (
        rating
      )
    `, { count: 'exact' });

  // Apply status filter
  query = query.eq('status', filter?.status || 'active');

  // Apply provider filter if specified
  if (filter?.provider_id) {
    query = query.eq('provider_id', filter.provider_id);
  }

  // Apply other filters
  if (filter) {
    if (filter.category) {
      query = query.eq('category', filter.category);
    }
    if (filter.minPrice) {
      query = query.gte('price', filter.minPrice);
    }
    if (filter.maxPrice) {
      query = query.lte('price', filter.maxPrice);
    }
    if (filter.location) {
      query = query.eq('location', filter.location);
    }
    if (filter.tags?.length) {
      query = query.contains('tags', filter.tags);
    }
  }

  // Apply sorting
  if (sort) {
    if (sort.field === 'rating') {
      // For rating sort, we'll sort after fetching the data
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    }
  } else {
    // Default sort by creation date, newest first
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: services, error, count } = await query;

  if (error) throw error;

  // Process the data to match the expected format
  let processedServices = services?.map(service => {
    // Calculate average rating
    const ratings = service.reviews?.map(r => r.rating) || [];
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    return {
      ...service,
      images: service.images?.sort((a, b) => a.order - b.order).map(img => img.url) || [],
      provider: {
        ...service.provider,
        rating: avgRating,
        total_reviews: ratings.length
      },
      reviews: undefined // Remove raw reviews data
    };
  }) || [];

  // Apply rating sort if needed
  if (sort?.field === 'rating') {
    processedServices.sort((a, b) => {
      const ratingA = a.provider?.rating || 0;
      const ratingB = b.provider?.rating || 0;
      return sort.direction === 'asc' ? ratingA - ratingB : ratingB - ratingA;
    });
  }

  return {
    services: processedServices,
    total: count || 0,
    page,
    limit
  };
}

export async function getServiceById(id: string) {
  const { data: service, error } = await supabase
    .from('services')
    .select(`
      *,
      provider:profiles!provider_id (
        full_name
      ),
      reviews:service_reviews(
        *,
        client:profiles!client_id(full_name)
      ),
      images:service_images(
        url,
        order
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  // Calculate average rating
  const ratings = service.reviews?.map(r => r.rating) || [];
  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;

  // Process images
  const processedService = {
    ...service,
    images: service.images?.sort((a, b) => a.order - b.order).map(img => img.url) || [],
    provider: {
      ...service.provider,
      rating: avgRating,
      total_reviews: ratings.length
    }
  };

  return processedService;
}

export async function createService(data: Omit<Service, 'id' | 'provider_id' | 'created_at' | 'updated_at' | 'status'>) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Start a transaction
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .insert({
      provider_id: user.id,
      title: data.title,
      description: data.description,
      price: data.price,
      duration: data.duration,
      category: data.category,
      location: data.location,
      tags: data.tags || [],
      status: 'active'
    })
    .select()
    .single();

  if (serviceError) throw serviceError;

  // Upload images if provided
  if (data.images?.length) {
    const imagePromises = data.images.map(async (image, index) => {
      const fileExt = image.name.split('.').pop();
      const fileName = `${service.id}/${index}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/services/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(filePath);

      return supabase
        .from('service_images')
        .insert({
          service_id: service.id,
          url: publicUrl,
          order: index
        });
    });

    await Promise.all(imagePromises);
  }

  return service;
}

export async function updateService(
  id: string,
  data: Partial<Omit<Service, 'id' | 'provider_id' | 'created_at' | 'updated_at'>>
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Update service details
  const { error: serviceError } = await supabase
    .from('services')
    .update({
      title: data.title,
      description: data.description,
      price: data.price,
      duration: data.duration,
      category: data.category,
      location: data.location,
      tags: data.tags
    })
    .eq('id', id)
    .eq('provider_id', user.id);

  if (serviceError) throw serviceError;

  // Handle image updates if provided
  if (data.images?.length) {
    // Delete existing images
    const { error: deleteError } = await supabase
      .from('service_images')
      .delete()
      .eq('service_id', id);

    if (deleteError) throw deleteError;

    // Upload new images
    const imagePromises = data.images.map(async (image, index) => {
      const fileExt = image.name.split('.').pop();
      const fileName = `${id}/${index}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/services/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(filePath);

      return supabase
        .from('service_images')
        .insert({
          service_id: id,
          url: publicUrl,
          order: index
        });
    });

    await Promise.all(imagePromises);
  }
}

export async function deleteService(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Call the delete_service_complete function with the correct parameter name
  const { data, error } = await supabase.rpc('delete_service_complete', {
    target_service_id: id
  });

  if (error) {
    throw new Error('Failed to delete service: ' + error.message);
  }

  return data;
}

export async function toggleServiceStatus(id: string, status: 'active' | 'inactive') {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('services')
    .update({ status })
    .eq('id', id)
    .eq('provider_id', user.id);

  if (error) throw error;
}