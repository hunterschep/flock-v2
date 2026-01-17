import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/constants/admin';

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return isAdminEmail(user?.email);
}

// GET - List all customers
export async function GET(_request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role client to bypass RLS on api_customers/api_keys tables
  const supabase = createServiceRoleClient();

  try {
    // Get customers with their API key count
    const { data: customers, error } = await supabase
      .from('api_customers')
      .select(`
        id,
        name,
        slug,
        contact_name,
        contact_email,
        tier,
        status,
        allowed_institution_ids,
        created_at,
        api_keys (id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Transform to include api_keys_count
    const transformedCustomers = (customers || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      contact_name: c.contact_name,
      contact_email: c.contact_email,
      tier: c.tier,
      status: c.status,
      allowed_institution_ids: c.allowed_institution_ids || [],
      created_at: c.created_at,
      api_keys_count: Array.isArray(c.api_keys) ? c.api_keys.length : 0,
    }));

    return NextResponse.json({ customers: transformedCustomers });
  } catch (error) {
    console.error('Error in GET /api/admin/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new customer
export async function POST(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, contact_name, contact_email, tier = 'starter' } = body;

    if (!name || !contact_name || !contact_email) {
      return NextResponse.json(
        { error: 'Name, contact name, and contact email are required' },
        { status: 400 }
      );
    }

    // Validate tier
    if (!['starter', 'pro', 'enterprise'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be starter, pro, or enterprise' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS on api_customers table
    const supabase = createServiceRoleClient();

    // Generate slug if not provided
    const customerSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('api_customers')
      .select('id')
      .eq('slug', customerSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A customer with this slug already exists' },
        { status: 400 }
      );
    }

    // Create customer
    const { data: customer, error } = await supabase
      .from('api_customers')
      .insert({
        name,
        slug: customerSlug,
        contact_name,
        contact_email,
        tier,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error in POST /api/admin/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a customer
export async function PATCH(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, tier, status, allowed_institution_ids, contact_name, contact_email } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Validate tier if provided
    if (tier && !['starter', 'pro', 'enterprise'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be starter, pro, or enterprise' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['active', 'suspended', 'cancelled', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS on api_customers table
    const supabase = createServiceRoleClient();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (tier !== undefined) updateData.tier = tier;
    if (status !== undefined) updateData.status = status;
    if (allowed_institution_ids !== undefined) updateData.allowed_institution_ids = allowed_institution_ids;
    if (contact_name !== undefined) updateData.contact_name = contact_name;
    if (contact_email !== undefined) updateData.contact_email = contact_email;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: customer, error } = await supabase
      .from('api_customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error in PATCH /api/admin/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

